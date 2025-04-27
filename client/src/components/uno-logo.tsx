export function UnoLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`${className} font-extrabold text-center`}>
      <div className="bg-red-600 text-white p-2 rounded-lg transform -rotate-6 inline-block">
        <span className="text-5xl tracking-tighter">UNO</span>
      </div>
    </div>
  );
}
