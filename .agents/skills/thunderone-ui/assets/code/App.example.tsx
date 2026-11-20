/**
 * Minimal wiring example for an Ant Design project in any ThunderOne Workspace.
 * Everything below <App> inherits the ThunderOne theme.
 * Workspace extras: import from '@rdthunderthailand/thunderone-theme/workspaces/<key>' (e.g. mediaStatus, MediaIcon).
 */
import { App, Badge, Button, ConfigProvider, Space } from 'antd';
import { t1Status, t1Theme } from '@rdthunderthailand/thunderone-theme/antd';
import { T1Icon } from '@rdthunderthailand/thunderone-theme/icons';
import '@rdthunderthailand/thunderone-theme/global.css';

function Example() {
  const { message } = App.useApp();
  return (
    <Space direction="vertical" size={12} style={{ padding: 24 }}>
      <Badge status={t1Status.success.badge} text="Success" />
      <Badge status={t1Status.warning.badge} text="Warning" />
      <Badge status={t1Status.error.badge} text="Error" />
      <Space>
        <Button icon={<T1Icon.refresh />}>Refresh</Button>
        <Button type="primary" icon={<T1Icon.create />} onClick={() => message.success('Created')}>
          Create
        </Button>
      </Space>
    </Space>
  );
}

export default function Root() {
  return (
    <ConfigProvider theme={t1Theme}>
      <App>
        <Example />
      </App>
    </ConfigProvider>
  );
}
