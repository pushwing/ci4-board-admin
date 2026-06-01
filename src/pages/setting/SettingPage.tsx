import { useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Form, Input, Switch, Button, App, Typography, Card, Divider, Spin } from 'antd'
import { fetchSetting, updateSetting } from '../../api/admin'
import type { SiteSetting } from '../../types'

export default function SettingPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-setting'],
    queryFn: () => fetchSetting().then((r) => r.data.data as SiteSetting),
  })

  useEffect(() => {
    if (!data) return
    form.setFieldsValue({
      browser_title_fix_value: data.browser_title_fix_value,
      join_used:               data.join_used === '1',
      site_block_used:         data.site_block_used === '1',
      site_block_contents:     data.site_block_contents,
    })
  }, [data, form])

  const saveMutation = useMutation({
    mutationFn: (values: any) =>
      updateSetting({
        browser_title_fix_value: values.browser_title_fix_value,
        join_used:               !!values.join_used,
        site_block_used:         !!values.site_block_used,
        site_block_contents:     values.site_block_contents ?? '',
      }),
    onSuccess: () => message.success('사이트 설정이 저장되었습니다.'),
    onError: (err: any) => message.error(err.response?.data?.message ?? '저장에 실패했습니다.'),
  })

  if (isLoading) return <Spin style={{ display: 'block', marginTop: 60 }} />

  return (
    <>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>사이트 설정</Typography.Title>

      <Card style={{ maxWidth: 560 }}>
        <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
          <Typography.Text strong>기본 설정</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />

          <Form.Item
            name="browser_title_fix_value"
            label="브라우저 타이틀 접미어"
            extra="예) CI4 Board  →  페이지명 | CI4 Board"
          >
            <Input placeholder="CI4 Board" />
          </Form.Item>

          <Form.Item name="join_used" label="회원가입 허용" valuePropName="checked">
            <Switch checkedChildren="허용" unCheckedChildren="차단" />
          </Form.Item>

          <Divider />
          <Typography.Text strong>사이트 차단</Typography.Text>
          <Divider style={{ margin: '8px 0 16px' }} />

          <Form.Item name="site_block_used" label="사이트 차단 활성화" valuePropName="checked">
            <Switch checkedChildren="차단 중" unCheckedChildren="정상" />
          </Form.Item>

          <Form.Item
            name="site_block_contents"
            label="차단 시 표시 메시지"
          >
            <Input.TextArea rows={3} placeholder="현재 사이트 점검 중입니다." />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
              저장
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </>
  )
}
