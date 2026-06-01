import { Form, Input, Button, Card, Typography, App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { adminLogin } from '../api/cms'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const onFinish = async (values: { login_id: string; password: string }) => {
    try {
      const res = await adminLogin(values.login_id, values.password)
      const { access_token, user } = res.data.data as any
      setAuth(access_token, user)
      navigate('/cms/pages')
    } catch (err: any) {
      message.error(err.response?.data?.message ?? '로그인에 실패했습니다.')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f5f5f5' }}>
      <Card style={{ width: 360 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          관리자 로그인
        </Typography.Title>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="login_id" label="아이디" rules={[{ required: true }]}>
            <Input size="large" placeholder="관리자 아이디" />
          </Form.Item>
          <Form.Item name="password" label="비밀번호" rules={[{ required: true }]}>
            <Input.Password size="large" placeholder="비밀번호" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              로그인
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
