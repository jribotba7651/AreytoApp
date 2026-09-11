import type { DeviceFrame as DeviceFrameType } from '@/types/layout';
import type { ReactNode } from 'react';

interface DeviceFrameProps {
  device: DeviceFrameType;
  children: ReactNode;
}

const FRAME_STYLES: Record<Exclude<DeviceFrameType, 'none'>, {
  width: string;
  height: string;
  borderRadius: string;
  bezel: string;
  bg: string;
}> = {
  kindle: {
    width: '400px',
    height: '580px',
    borderRadius: '12px',
    bezel: '24px 20px',
    bg: '#1a1a1a',
  },
  print: {
    width: '420px',
    height: '594px',
    borderRadius: '2px',
    bezel: '32px 28px',
    bg: '#f5f0e8',
  },
  tablet: {
    width: '480px',
    height: '640px',
    borderRadius: '20px',
    bezel: '28px 16px',
    bg: '#2d2d2d',
  },
};

function DeviceFrame({ device, children }: DeviceFrameProps) {
  if (device === 'none') {
    return <>{children}</>;
  }

  const frame = FRAME_STYLES[device];
  const isKindle = device === 'kindle';
  const isPrint = device === 'print';

  return (
    <div className="flex justify-center py-8">
      <div
        style={{
          width: frame.width,
          height: frame.height,
          borderRadius: frame.borderRadius,
          padding: frame.bezel,
          backgroundColor: frame.bg,
          boxShadow: isPrint
            ? '4px 4px 12px rgba(0,0,0,0.15)'
            : '0 8px 32px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="h-full overflow-y-auto"
          style={{
            backgroundColor: isKindle ? '#e8e4d9' : '#ffffff',
            borderRadius: isPrint ? '0' : '4px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default DeviceFrame;
