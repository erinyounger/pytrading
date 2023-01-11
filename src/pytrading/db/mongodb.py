#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：mongodb
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:22 
"""
from pymongo import MongoClient
import mongoengine as mongo_db


class PymongoClient:
    def __init__(self, host, db_name, port=27017, username="", password="", read_only=False):
        self.host = "mongodb://%s:%s@%s" % (username, password, host)
        self.port = port
        self.db_name = db_name
        self.client = MongoClient(self.host, self.port, authsource=db_name, connect=False)
        self.db = self.client[db_name]
        if not read_only:
            self.engine = mongo_db.connect(db=self.db_name, host=self.host, username=username, password=password)
