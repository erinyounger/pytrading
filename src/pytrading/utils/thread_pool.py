#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：thread_pool
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/19 22:41 
"""
import multiprocessing
from queue import Queue


class ThreadPool:
    def __init__(self, queue: Queue, size=None):
        self.queue = queue
        size = size if size else multiprocessing.cpu_count()*1
        self.process_pool = multiprocessing.Pool(size)

    def run(self):
        queue_size = self.queue.qsize()
        for _ in range(queue_size):
            func, args, kwargs = self.queue.get(block=True)
            self.process_pool.apply_async(func=func, args=args, kwds=kwargs)
        self.process_pool.close()
        self.process_pool.join()
