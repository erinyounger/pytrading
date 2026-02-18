#!/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Description    ：线程池实现
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/19 22:41
"""
import multiprocessing
from queue import Queue, Empty


class ThreadPool:
    def __init__(self, queue: Queue, size=None):
        self.queue = queue
        size = size if size else multiprocessing.cpu_count()
        self.process_pool = multiprocessing.Pool(size)
        self._cancelled = False

    def run(self):
        while not self.queue.empty():
            if self._cancelled:
                self._clear_queue()
                break
            try:
                func, args, kwargs = self.queue.get(block=True)
                self.process_pool.apply_async(func=func, args=args, kwds=kwargs)
            except Empty:
                break

        self.process_pool.close()
        self.process_pool.join()

    def _clear_queue(self):
        """清空队列"""
        while not self.queue.empty():
            try:
                self.queue.get_nowait()
            except Empty:
                break

    def cancel(self):
        """取消执行，设置取消标记"""
        self._cancelled = True
