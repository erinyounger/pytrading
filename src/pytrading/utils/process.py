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
import locale

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
        
        # 设置环境变量，确保中文支持
        env_dict = copy.deepcopy(os.environ)
        if env:
            env_dict.update(env)
        
        # 设置中文编码环境变量
        env_dict['PYTHONIOENCODING'] = 'utf-8'
        env_dict['PYTHONUTF8'] = '1'
        
        # 在Windows上设置控制台代码页为UTF-8
        if is_windows():
            env_dict['PYTHONLEGACYWINDOWSSTDIO'] = '1'
            # 设置控制台代码页为UTF-8
            try:
                os.system('chcp 65001 > nul')
            except:
                pass
        
        subproc = subprocess.Popen(shlex.split(cmd),
                                   stdout=subprocess.PIPE,
                                   stderr=subprocess.STDOUT,
                                   bufsize=1,
                                   env=env_dict,
                                   cwd=cwd,
                                   encoding="utf-8",
                                   errors="replace",
                                   universal_newlines=True,
                                   creationflags=subprocess_flag
                                   )
        logger.info("Run cmd: {}, Pid: {}, name: {}".format(cmd, subproc.pid, get_process_name(subproc.pid)))
        return subproc
    except Exception as ex:
        logger.exception("Run cmd: {} fail. \n {}".format(cmd, traceback.format_exc()))


def wait_process(process):
    rc = 1
    pid = int(process.pid)
    process_name = get_process_name(pid)
    try:
        while process.poll() is None and is_process_running(pid, process_name):
            for line in iter(process.stdout.readline, ''):
                if line:
                    # 确保输出是UTF-8编码
                    try:
                        if isinstance(line, bytes):
                            line = line.decode('utf-8', errors='replace')
                        sys.stdout.write(line)
                        sys.stdout.flush()
                    except UnicodeDecodeError:
                        # 如果解码失败，使用replace模式
                        sys.stdout.write(line.encode('utf-8', errors='replace').decode('utf-8'))
                        sys.stdout.flush()
                
                if process.poll() is not None and line == "":
                    break
            process.stdout.flush()
            rc = 0 if process.wait() is None else process.wait()
    except Exception as e:
        logger.exception(f"Wait process error: {e}")
        rc = 1
    return rc


def terminate_process_tree(pid):
    """递归终止进程及其所有子进程"""
    try:
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
        logger.warning(f"终止进程树失败 (pid={pid}): {e}")


def exec_process(cmd, env=None, cwd=None, pool=None):
    process = start_process(cmd=cmd, env=env, cwd=cwd)
    if process is None:
        return 1
    if pool:
        pool.register_process(process)
    try:
        result = wait_process(process)
        if result and not getattr(pool, '_cancelled', False):
            logger.error("Run Cmd: {} fail. ret: {}".format(cmd, result))
    finally:
        if pool:
            pool.unregister_process(process)
    return result
