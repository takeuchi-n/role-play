interface DemoMessageProps {
  role: 'salesman' | 'prospect';
  content: string;
  timestamp: number;
  prospectName?: string;
}

export default function DemoMessage({ role, content, timestamp, prospectName }: DemoMessageProps) {
  const isSalesman = role === 'salesman';
  const time = new Date(timestamp).toLocaleTimeString('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const displayName = isSalesman ? 'AI営業マン' : (prospectName || '見込み客');

  return (
    <div className={`flex ${isSalesman ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-[70%]">
        <div
          className={`rounded-lg px-4 py-2 ${
            isSalesman
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-800'
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{content}</p>
        </div>
        <div
          className={`text-xs text-gray-500 mt-1 ${
            isSalesman ? 'text-right' : 'text-left'
          }`}
        >
          {displayName} • {time}
        </div>
      </div>
    </div>
  );
}
