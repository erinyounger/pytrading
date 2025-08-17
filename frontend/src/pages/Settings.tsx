import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Switch,
  Select,
  Button,
  message,
  Divider,
  Typography,
  Space,
  Alert,
  Table,
  Modal,
  Tag,
  Tabs
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { apiService } from '../services/api';
import { SystemConfig } from '../types';

const { Option } = Select;
const { Title } = Typography;

const Settings: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<SystemConfig>({
    trading_mode: 'backtest',
    db_type: 'mysql',
    save_db: true,
    symbols: []
  });
  const [symbolModalVisible, setSymbolModalVisible] = useState(false);
  const [newSymbol, setNewSymbol] = useState({ symbol: '', name: '' });

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getConfig();
      setConfig(response);
      form.setFieldsValue(response);
    } catch (error) {
      message.error('获取配置失败');
    } finally {
      setLoading(false);
    }
  }, [form]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      await apiService.updateConfig(values);
      setConfig({ ...config, ...values });
      message.success('配置已保存');
    } catch (error) {
      message.error('保存配置失败');
    } finally {
      setLoading(false);
    }
  };

  const addSymbol = () => {
    if (!newSymbol.symbol || !newSymbol.name) {
      message.error('请输入完整的股票信息');
      return;
    }
    
    const updatedSymbols = [...config.symbols, `${newSymbol.symbol}:${newSymbol.name}`];
    setConfig({ ...config, symbols: updatedSymbols });
    form.setFieldValue('symbols', updatedSymbols);
    setNewSymbol({ symbol: '', name: '' });
    setSymbolModalVisible(false);
    message.success('股票已添加');
  };

  const removeSymbol = (index: number) => {
    const updatedSymbols = config.symbols.filter((_, i) => i !== index);
    setConfig({ ...config, symbols: updatedSymbols });
    form.setFieldValue('symbols', updatedSymbols);
    message.success('股票已移除');
  };

  const symbolColumns = [
    {
      title: '股票代码',
      key: 'symbol',
      render: (_: any, record: string, index: number) => {
        const [symbol] = record.split(':');
        return <Tag color="blue">{symbol}</Tag>;
      },
    },
    {
      title: '股票名称',
      key: 'name',
      render: (_: any, record: string) => {
        const [, name] = record.split(':');
        return name || '-';
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: string, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeSymbol(index)}
        >
          移除
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>系统设置</Title>
      
      <Tabs defaultActiveKey="general" type="card">
        <Tabs.TabPane tab={
          <span>
            <SettingOutlined />
            常规设置
          </span>
        } key="general">
          <Card>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
              initialValues={config}
            >
              <Row gutter={[24, 16]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="trading_mode"
                    label="交易模式"
                    tooltip="选择回测模式进行历史数据测试，或实盘模式进行真实交易"
                  >
                    <Select>
                      <Option value="backtest">回测模式</Option>
                      <Option value="live">实盘模式</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="db_type"
                    label="数据库类型"
                    tooltip="选择用于存储交易数据的数据库类型"
                  >
                    <Select>
                      <Option value="mysql">MySQL</Option>
                      <Option value="mongodb">MongoDB</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="save_db"
                    label="启用数据库存储"
                    valuePropName="checked"
                    tooltip="是否将交易结果保存到数据库"
                  >
                    <Switch />
                  </Form.Item>
                </Col>

                <Col span={24}>
                  <Divider orientation="left">操作</Divider>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />}
                      loading={loading}
                    >
                      保存配置
                    </Button>
                    <Button 
                      icon={<ReloadOutlined />} 
                      onClick={fetchConfig}
                      loading={loading}
                    >
                      重新加载
                    </Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab={
          <span>
            <DatabaseOutlined />
            股票池管理
          </span>
        } key="symbols">
          <Card 
            title="股票池配置"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setSymbolModalVisible(true)}
              >
                添加股票
              </Button>
            }
          >
            <Alert
              message="股票池管理"
              description="管理系统中用于交易的股票代码。如果为空，系统将使用默认的上证50成分股。"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Table
              columns={symbolColumns}
              dataSource={config.symbols}
              rowKey={(record, index) => `${record}_${index}`}
              pagination={{ pageSize: 10 }}
              size="small"
            />
          </Card>
        </Tabs.TabPane>

        <Tabs.TabPane tab={
          <span>
            <ApiOutlined />
            API配置
          </span>
        } key="api">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="掘金量化API配置">
                <Alert
                  message="API配置说明"
                  description="掘金量化API配置通过环境变量管理，请在.env文件中配置相关参数。"
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Form layout="vertical">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="回测策略ID">
                        <Input 
                          placeholder="BACKTEST_STRATEGY_ID" 
                          disabled 
                          addonBefore="环境变量"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="实盘策略ID">
                        <Input 
                          placeholder="LIVE_STRATEGY_ID" 
                          disabled 
                          addonBefore="环境变量"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="回测Token">
                        <Input.Password 
                          placeholder="BACKTEST_TRADING_TOKEN" 
                          disabled 
                          addonBefore="环境变量"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="实盘Token">
                        <Input.Password 
                          placeholder="LIVE_TRADING_TOKEN" 
                          disabled 
                          addonBefore="环境变量"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>

        <Tabs.TabPane tab={
          <span>
            <SecurityScanOutlined />
            安全设置
          </span>
        } key="security">
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Card title="风险控制">
                <Form layout="vertical">
                  <Row gutter={[16, 16]}>
                    <Col xs={24} md={8}>
                      <Form.Item label="最大仓位比例">
                        <Input 
                          placeholder="0.95" 
                          suffix="%" 
                          disabled
                          addonAfter="暂未实现"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="单笔最大交易金额">
                        <Input 
                          placeholder="100000" 
                          suffix="元" 
                          disabled
                          addonAfter="暂未实现"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={8}>
                      <Form.Item label="日内最大亏损">
                        <Input 
                          placeholder="10000" 
                          suffix="元" 
                          disabled
                          addonAfter="暂未实现"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                </Form>
              </Card>
            </Col>

            <Col span={24}>
              <Card title="数据安全">
                <Alert
                  message="数据安全建议"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      <li>定期备份交易数据和配置文件</li>
                      <li>使用强密码保护数据库访问</li>
                      <li>限制API Token的访问权限</li>
                      <li>监控异常交易行为</li>
                      <li>使用HTTPS协议进行数据传输</li>
                    </ul>
                  }
                  type="info"
                  showIcon
                />
              </Card>
            </Col>
          </Row>
        </Tabs.TabPane>
      </Tabs>

      {/* 添加股票模态框 */}
      <Modal
        title="添加股票"
        open={symbolModalVisible}
        onOk={addSymbol}
        onCancel={() => {
          setSymbolModalVisible(false);
          setNewSymbol({ symbol: '', name: '' });
        }}
        okText="添加"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="股票代码" required>
            <Input
              placeholder="例如: SZSE.000625"
              value={newSymbol.symbol}
              onChange={(e) => setNewSymbol({ ...newSymbol, symbol: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="股票名称" required>
            <Input
              placeholder="例如: 长安汽车"
              value={newSymbol.name}
              onChange={(e) => setNewSymbol({ ...newSymbol, name: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Settings;