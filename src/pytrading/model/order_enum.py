#!/usr/bin/env python 
# -*- coding:utf-8 -*-　　
"""
@Description    ：order
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/6 23:05 
"""


class Order:
    order_type = None
    trade_n = 0
    side = None

    def __init__(self, order_type, trade_n, side):
        self.order_type = order_type
        self.trade_n = trade_n
        self.side = side


class OrderAction:
    order_unknown = "order_unknown"
    order_volume_type = "order_volume"
    order_value_type = "order_value"
    order_percent_type = "order_percent"
    order_target_volume_type = "order_target_volume"
    order_target_value_type = "order_target_value"
    order_target_percent_type = "order_target_percent"
    order_close_all_type = "order_close_all"

    @classmethod
    def order_volume(cls, side, trade_n):
        """按指定量委托"""
        return Order(cls.order_volume_type, trade_n=trade_n, side=side)

    @classmethod
    def order_percent(cls, side, trade_n):
        """按总资产指定比例委托"""
        return Order(cls.order_percent_type, trade_n=trade_n, side=side)

    @classmethod
    def order_target_percent(cls, side, trade_n: float):
        """调仓到目标持仓比例（总资产的比例）"""
        return Order(cls.order_target_percent_type, trade_n=trade_n, side=side)

    @classmethod
    def order_close_all(cls):
        """平当前所有可平持仓"""
        return Order(cls.order_close_all_type, trade_n=None, side=None)
