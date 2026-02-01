import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  className = '',
  headerClassName = '',
  rowClassName = '',
  emptyMessage = 'No hay datos disponibles',
}: TableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };
  
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width }}
                className={`
                  px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${alignClasses[column.align || 'left']}
                  ${headerClassName}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr key={index} className={`hover:bg-gray-50 ${rowClassName}`}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-6 py-4 whitespace-nowrap text-sm text-gray-900
                      ${alignClasses[column.align || 'left']}
                    `}
                  >
                    {column.render
                      ? column.render(item)
                      : item[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
