#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：线程池实现
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/19 22:41
"""
import threading
import multiprocessing
from queue import Queue, Empty

import psutil

from pytrading.logger import logger


class ThreadPool:
    def __init__(self, queue: Queue, size=None):
        self.queue = queue
        self._size = size if size else multiprocessing.cpu_count()
        self._cancelled = False
        self._semaphore = threading.Semaphore(self._size)
        self._threads: list[threading.Thread] = []
        self._active_processes: list = []
        self._lock = threading.Lock()

    def run(self):
        while not self.queue.empty():
            if self._cancelled:
                break

            acquired = False
            while not acquired:
                acquired = self._semaphore.acquire(timeout=1)
                if self._cancelled:
                    if acquired:
                        self._semaphore.release()
                    break

            if self._cancelled:
                break

            try:
                func, args, kwargs = self.queue.get_nowait()
            except Empty:
                self._semaphore.release()
                break

            t = threading.Thread(target=self._worker, args=(func, args, kwargs))
            t.daemon = True
            t.start()
            self._threads.append(t)

        if self._cancelled:
            self._clear_queue()

        for t in self._threads:
            t.join()

    def _worker(self, func, args, kwargs):
        try:
            if not self._cancelled:
                kwargs = dict(kwargs) if kwargs else {}
                kwargs['pool'] = self
                func(*args, **kwargs)
        finally:
            self._semaphore.release()

    def register_process(self, process):
        with self._lock:
            self._active_processes.append(process)

    def unregister_process(self, process):
        with self._lock:
            try:
                self._active_processes.remove(process)
            except ValueError:
                pass

    def cancel(self):
        self._cancelled = True
        self._clear_queue()
        self._terminate_processes()

    def _terminate_processes(self):
        with self._lock:
            for proc in list(self._active_processes):
                try:
                    pid = proc.pid
                    parent = psutil.Process(pid)
                    children = parent.children(recursive=True)
                    for child in children:
                        try:
                            child.terminate()
                        except psutil.NoSuchProcess:
                            pass
                    parent.terminate()
                    gone, alive = psutil.wait_procs(children + [parent], timeout=3)
                    for p in alive:
                        try:
                            p.kill()
                        except psutil.NoSuchProcess:
                            pass
                except psutil.NoSuchProcess:
                    pass
                except Exception as e:
                    logger.warning(f"终止进程失败: {e}")
            self._active_processes.clear()

    def _clear_queue(self):
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except Empty:
                break
