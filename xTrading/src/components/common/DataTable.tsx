import React from 'react';
import { ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

interface Column {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
  render?: (value: any, record: any, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  loading?: boolean;
  pagination?: boolean;
  pageSize?: number;
  currentPage?: number;
  total?: number;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
  onRowClick?: (record: any, index: number) => void;
  className?: string;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  loading = false,
  pagination = true,
  pageSize = 10,
  currentPage = 1,
  total = 0,
  onSort,
  onPageChange,
  onRowClick,
  className,
}) => {
  const [sortConfig, setSortConfig] = React.useState<{
    key: string;
    order: 'asc' | 'desc';
  } | null>(null);

  const handleSort = (key: string) => {
    if (!onSort) return;

    let order: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.order === 'asc') {
      order = 'desc';
    }

    setSortConfig({ key, order });
    onSort(key, order);
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="w-4 h-4 text-[var(--text-disabled)]" />;
    }
    return sortConfig.order === 'asc' ? (
      <ChevronUp className="w-4 h-4 text-[var(--brand-primary)]" />
    ) : (
      <ChevronDown className="w-4 h-4 text-[var(--brand-primary)]" />
    );
  };

  const getTextAlign = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  if (loading) {
    return (
      <div className={cn('card', className)}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key} style={{ width: column.width }}>
                    <div className="skeleton h-4 w-full rounded"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key}>
                      <div className="skeleton h-4 w-full rounded"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('card', className)}>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{ width: column.width }}
                  className={cn(
                    getTextAlign(column.align),
                    column.sortable && 'cursor-pointer hover:bg-[var(--bg-hover)]'
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.title}</span>
                    {column.sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-12 text-[var(--text-secondary)]">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-[var(--text-disabled)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p>暂无数据</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={index}
                  className={cn(
                    'hover:bg-[var(--bg-hover)] transition-colors',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(record, index)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={getTextAlign(column.align)}
                    >
                      {column.render
                        ? column.render(record[column.key], record, index)
                        : record[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && total > 0 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-primary)]">
          <div className="text-sm text-[var(--text-secondary)]">
            显示 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                'px-3 py-1 rounded text-sm',
                currentPage === 1
                  ? 'text-[var(--text-disabled)] cursor-not-allowed'
                  : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
              )}
            >
              上一页
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={cn(
                      'w-8 h-8 rounded text-sm transition-colors',
                      pageNum === currentPage
                        ? 'bg-[var(--brand-primary)] text-white'
                        : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                'px-3 py-1 rounded text-sm',
                currentPage === totalPages
                  ? 'text-[var(--text-disabled)] cursor-not-allowed'
                  : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
              )}
            >
              下一页
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
