#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：process
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2023/3/3 23:38 
"""
import re
import os
import copy
import shlex
import sys
import traceback

import psutil
import subprocess

from pytrading.logger import logger


def is_windows():
    return os.name == "nt"


def get_process_name(pid):
    try:
        if not isinstance(pid, int):
            return None
        return psutil.Process(pid).name()
    except Exception as ex:
        pass
    return None


def is_process_running(pid, process_name=None):
    try:
        p = psutil.Process(int(pid))
        if p and p.name():
            return p.is_running() and re.search(r"^%s(\.exe)?$" % process_name, p.name(), flags=re.IGNORECASE)
    except psutil.NoSuchProcess:
        pass
    except BaseException:
        logger.exception("Chech process running error, Pid: {}".format(pid))


def start_process(cmd, env: dict = None, cwd: str = None):
    """开始子进程"""
    try:
        subprocess_flag = 0
        if is_windows():
            import ctypes
            SEM_NOGPFAULTTERRORBOX = 0x0002
            ctypes.windll.kernel32.SetErrorMode(SEM_NOGPFAULTTERRORBOX)
            subprocess_flag = 0x8000000
        env_dict = copy.deepcopy(os.environ)
        if env:
            env_dict.update(env)
        subproc = subprocess.Popen(shlex.split(cmd),
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT,
                                   bufsize=1,
                                   env=env_dict,
                                   cwd=cwd,
                                   encoding="utf8",
                                   universal_newlines=True,
                                   creationflags=subprocess_flag
                                   )
        logger.info("Run cmd: {}, Pid: {}, name: {}".format(cmd, subproc.pid, get_process_name(subproc.pid)))
        return subproc
    except Exception as ex:
        logger.exception("Run cmd: {} fail. \n {}".format(cmd, traceback.print_exception(())))


def wait_process(process):
    rc = 1
    pid = int(process.pid)
    process_name = get_process_name(pid)
    try:
        while process.poll() is None and is_process_running(pid, process_name):
            for line in iter(process.stdout.readline, b''):
                sys.stdout.write(line)
                sys.stdout.flush()
                if process.poll() is not None and line == "":
                    break
            process.stdout.flush()
            rc = 0 if process.wait() is None else process.wait()
    except:
        rc = 1
    return rc


def exec_process(cmd, env=None, cwd=None):
    process = start_process(cmd=cmd, env=env, cwd=cwd)
    result = wait_process(process)
    if result:
        logger.error("Run Cmd: {} fail. ret: {}".format(cmd, result))
    return result
