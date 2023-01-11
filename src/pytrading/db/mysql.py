#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：mysql
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/20 21:36 
"""
from sqlalchemy import create_engine


class MySQLClient:
    def __init__(self, host, db_name, port=3306, username="", password=""):
        self.host = host
        self.db_name = db_name
        self.port = port
        self.conn = create_engine(
            f"mysql+mysqlconnector://{username}:{password}@{self.host}:{self.port}/{self.db_name}?charset=utf8")
