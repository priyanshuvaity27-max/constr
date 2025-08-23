import React, { useState } from 'react';
import { Search, MoreHorizontal, Edit, Trash2, Eye, Download, Upload } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
}

interface Action {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: (row: any) => void;
  variant?: 'primary' | 'danger' | 'secondary';
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  actions?: Action[];
  searchable?: boolean;
  exportable?: boolean;
  importable?: boolean;
  onImport?: () => void;
  onExport?: () => void;
  title?: string;
  loading?: boolean;
  meta?: {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  };
  onPageChange?: (page: number) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  actions = [],
  searchable = true,
  exportable = false,
  importable = false,
  onImport,
  onExport,
  title,
  loading = false,
  meta,
  onPageChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Filter data based on search term
  const filteredData = data.filter(row =>
    Object.values(row).some(value =>
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Sort data
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Use server-side pagination if meta is provided
  const paginatedData = meta ? data : sortedData.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = meta ? meta.total_pages : Math.ceil(sortedData.length / itemsPerPage);
  const currentPage = meta ? meta.page : currentPage;

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const getActionButtonClasses = (variant: string = 'secondary') => {
    const baseClasses = 'p-2 rounded-lg transition-colors';
    switch (variant) {
      case 'primary':
        return `${baseClasses} text-blue-600 hover:bg-blue-50`;
      case 'danger':
        return `${baseClasses} text-red-600 hover:bg-red-50`;
      default:
        return `${baseClasses} text-gray-600 hover:bg-gray-50`;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            <p className="text-sm text-gray-500">
              Showing {paginatedData.length} of {filteredData.length} results
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            {searchable && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full sm:w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {importable && (
              <button
                onClick={onImport}
                className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
            )}
            
            {exportable && (
              <button
                onClick={onExport}
                className="inline-flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-blue-600">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="px-6 py-12 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            ) : (
            {paginatedData.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-1">
                      {actions.map((action, actionIndex) => {
                        const ActionIcon = action.icon;
                        return (
                          <button
                            key={actionIndex}
                            onClick={() => action.onClick(row)}
                            className={getActionButtonClasses(action.variant)}
                            title={action.label}
                          >
                            <ActionIcon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
            )}
          </tbody>
        </table>
      </div>

      {!loading && totalPages > 1 && (
        <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {meta && (
                <span>
                  Showing {((meta.page - 1) * meta.page_size) + 1} to {Math.min(meta.page * meta.page_size, meta.total)} of {meta.total} results
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
              <button
                onClick={() => onPageChange ? onPageChange(Math.max(1, currentPage - 1)) : setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2 sm:px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => onPageChange ? onPageChange(i + 1) : setCurrentPage(i + 1)}
                  className={`px-2 sm:px-3 py-1 text-sm rounded ${
                    currentPage === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => onPageChange ? onPageChange(Math.min(totalPages, currentPage + 1)) : setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2 sm:px-3 py-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;