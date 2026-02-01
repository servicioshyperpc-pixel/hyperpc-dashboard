import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  header,
  footer,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm ${className}`}>
      {header && (
        <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
          {header}
        </div>
      )}
      <div className={`px-6 py-4 ${bodyClassName}`}>
        {children}
      </div>
      {footer && (
        <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg ${footerClassName}`}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
