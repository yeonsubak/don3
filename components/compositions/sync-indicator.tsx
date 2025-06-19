import { CircleHelp, CircleSmall, CloudOff } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';

export const SyncIndicator = () => {
  type Status = 'ready' | 'offline' | 'notConfigured' | 'disabled';

  const [status, setStatus] = useState<Status>('notConfigured');

  if (status === 'ready') {
    return (
      <Badge variant="secondary" className="bg-green-600 text-white">
        <CircleSmall size={10} fill="#ffffff" className="animate-pulse" />
        Sync On
      </Badge>
    );
  }

  if (status === 'offline') {
    return (
      <Badge variant="destructive" className="">
        <CloudOff size={10} />
        Offline
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-gray-300">
      <CircleHelp size={10} />
      Sync Disabled
    </Badge>
  );
};
