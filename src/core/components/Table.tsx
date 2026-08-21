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

  // overflow-x-auto por si solo crea un contenedor de scroll en AMBOS ejes y
  // el sticky del thead se pegaria a ese div (quedando inerte). Con
  // overflow-y-visible el eje vertical deja de recortarse, asi el sticky se
  // resuelve contra la pagina y el scroll lateral se conserva.
  return (
    <div className={`overflow-x-auto overflow-y-visible ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {/* position:sticky NO aplica a <thead> ni a <tr> (los navegadores lo
            ignoran en esos elementos): hay que ponerlo en cada <th>. El offset
            sale de --table-sticky-top, que la vista calcula segun la altura
            real de sus barras fijas; z-10 lo deja por debajo de ellas. */}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={{ width: column.width, top: 'var(--table-sticky-top, 52px)' }}
                className={`
                  sticky z-10 bg-gray-50 shadow-[0_1px_0_0_rgba(0,0,0,0.08)]
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
