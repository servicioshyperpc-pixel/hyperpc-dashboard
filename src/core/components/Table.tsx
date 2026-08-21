import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: React.ReactNode;
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
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  className = '',
  headerClassName = '',
  rowClassName = '',
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
}: TableProps<T>) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  // overflow-x-auto crearía un contenedor de scroll propio y el sticky del
  // thead dejaría de funcionar (se pegaría al div, no al viewport). Con
  // overflow-x-clip la tabla sigue recortada horizontalmente pero el sticky
  // vertical se resuelve contra la página.
  return (
    <div className={`overflow-x-clip ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {/* Header pegajoso: acompaña el scroll de la lista. El offset coincide
            con la barra de filtros (top-[52px] sm:top-[60px]) para que quede
            justo debajo y no se solapen. */}
        <thead className="sticky top-[52px] sm:top-[60px] z-20 bg-gray-50 shadow-[0_1px_0_0_rgba(0,0,0,0.08)]">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width }}
                className={`
                  px-3 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider
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
              <tr
                key={index}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`
                      px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900
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
