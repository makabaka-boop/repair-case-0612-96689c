import { useEffect, useRef, useState } from 'react';
import type { ModeResult } from './lib/mode';

interface VirtualTableProps {
  answers: ModeResult[];
  queries: { left: number; right: number }[];
}

const ROW_HEIGHT = 30;
const OVERSCAN = 12;

/** 可滚动结果表：仅渲染可视区行，20 万行也能流畅浏览，且保持原顺序。 */
export function VirtualTable({ answers, queries }: VirtualTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      setViewportHeight(entries[0].contentRect.height);
    });
    observer.observe(el);
    setViewportHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [answers]);

  const total = answers.length;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    total,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  );

  const rows: JSX.Element[] = [];
  for (let i = startIndex; i < endIndex; i++) {
    const a = answers[i];
    const q = queries[i];
    rows.push(
      <tr
        key={i}
        className={i % 2 === 0 ? 'row-even' : 'row-odd'}
        style={{ height: ROW_HEIGHT }}
      >
        <td className="col-index" data-label="序号">
          {i + 1}
        </td>
        <td className="col-range" data-label="边界">
          [{q.left}, {q.right}]
        </td>
        <td className="col-mode" data-label="众数">
          {a.value}
        </td>
        <td className="col-count" data-label="频次">
          {a.count}
        </td>
      </tr>,
    );
  }

  return (
    <div className="table-scroll" ref={scrollRef} onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}>
      <table className="result-table">
        <thead className="result-head">
          <tr style={{ height: ROW_HEIGHT }}>
            <th className="col-index">序号</th>
            <th className="col-range">边界 [left, right]</th>
            <th className="col-mode">众数</th>
            <th className="col-count">频次</th>
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
}
