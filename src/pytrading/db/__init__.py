#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：__init__.py
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 10:40 
"""
from pytrading.db.mongodb import PymongoClient, mongo_db
from pytrading.db.mysql import MySQLClient

MONGODB_SETTINGS = {
    "db": "py_trading",
    "host": "192.168.3.100:27017",
    "username": "admin",
    "password": "admin"
}

mongo_client = PymongoClient(
    host=MONGODB_SETTINGS["host"],
    db_name=MONGODB_SETTINGS["db"],
    username=MONGODB_SETTINGS["username"],
    password=MONGODB_SETTINGS["password"]
)
