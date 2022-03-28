
import { notification } from 'antd';
import Button from 'components/Button'

export default function useNotification(){

    function openNotification(message, description, callback) {
        const key = `open${Date.now()}`;
        const btn = (
        <Button type="secondary" text="Confirm" size="small" onClick={() => {callback(); notification.close(key);}}>
            Confirm
        </Button>
        );
        notification.open({
        message,
        description,
        btn,
        key,
        duration: 5,
        onClose: callback,
        });
    };

  return { 
    openNotification
  }

}