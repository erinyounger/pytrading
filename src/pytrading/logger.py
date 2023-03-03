# -*- coding:utf-8 -*-
import os
import logging

log_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), "..", "..", "logs")
log_file = os.path.join(log_path, "py-trading.log")

if not os.path.exists(log_path):
    os.makedirs(log_path)

logger = logging.getLogger("pytrading")
ch_handler = logging.StreamHandler()
fh_handler = logging.FileHandler(log_file)

formatter = logging.Formatter('[%(asctime)s][%(name)-4s][%(filename)s line:%(lineno)d][%(levelname)-4s][%(thread)d] > %(message)s')
ch_handler.setFormatter(formatter)
fh_handler.setFormatter(formatter)

logger.addHandler(ch_handler)
logger.addHandler(fh_handler)
logger.setLevel(logging.INFO)
