#!/usr/bin/env python
# -*- coding:utf-8 -*-　　
"""
@Description    ：order_controller
@Author  ：EEric
@Email  : yflying7@gmail.com
@Date    ：2022/11/6 23:10
"""
from gm.api import *
from gm.model.storage import Context

from pytrading.strategy.base import StrategyBase
from pytrading.config.order_enum import OrderAction, Order
from pytrading.logger import logger
from pytrading.config import config


class OrderController:
    """订单控制器"""
    def __init__(self):
        self.context = None
        self.token: str
        self.account_id: str
        self.save_db: bool = config.save_db
        self.strategy_id: str
        self.symbol: str
        self.strategy: StrategyBase

    def setup(self, context: Context):
        if self.context:
            return
        self.context = context
        self.symbol = getattr(context, "symbol", None)
        self.strategy_id = context.strategy_id
        self.token = context.token
        if context.mode == MODE_LIVE:
            self.account_id = context.account(account_id=config.account_id_live).id
        else:
            self.account_id = context.account().id
        context.order_controller = self
        logger.info("SetUp Order Controller Success, symbol: {}, account_id: {}".format(self.symbol, self.account_id))

    @property
    def __position(self):
        position = self.context.account(account_id=self.account_id).position(symbol=self.symbol, side=PositionSide_Long)
        if not position:
            position = {
                "volume": 0,
                "volume_today": 0,
                "amount": 0,
                "available_now": 0
            }
        return position

    @property
    def __cash(self):
        """金额字典"""
        return self.context.account(account_id=self.account_id).cash

    @property
    def volume(self):
        """当前持仓，用于卖出时计算卖出量"""
        return self.__position["volume"]

    @property
    def volume_today(self):
        """今日买入量，当天买入量当天不能卖出， 昨持仓量= (volume - volume_today)"""
        return self.__position["volume_today"]

    @property
    def volume_amount(self):
        """持仓额 (volume*vwap*multiplier)"""
        return self.__position["amount"]

    @property
    def volume_available_now(self):
        """当前可用仓位"""
        return self.__position["available_now"]

    @property
    def cash_available(self):
        """当前可用资金"""
        return self.__cash["available"]

    @property
    def cash_all(self):
        """账户总资金"""
        return self.__cash["nav"]

    def get_volume_by_atr(self, percent: float, atr: float):
        """通过ATR获取影响总仓位百分比的交易量，返回多少手"""
        return int(self.cash_all * percent / atr / 100)

    def buy(self):
        """买入"""

    def sell(self):
        """卖出"""

    def all_in(self):
        """全仓买入"""

    def all_sell(self):
        """清仓"""

    def run_order(self, order: Order):
        pos_effect = PositionEffect_Open if order.side == OrderSide_Buy else PositionEffect_Close
        if OrderAction.order_volume_type == order.order_type:
            order_volume(symbol=self.symbol, volume=order.trade_n,
                         side=order.side,
                         order_type=OrderType_Market,
                         position_effect=pos_effect,
                         account=self.account_id)
        elif OrderAction.order_target_percent_type == order.order_type:
            order_target_percent(symbol=self.symbol,
                                 percent=order.trade_n,
                                 position_side=order.side,
                                 order_type=OrderType_Market,
                                 account=self.account_id)
        elif OrderAction.order_close_all_type == order.order_type:
            order_close_all()
