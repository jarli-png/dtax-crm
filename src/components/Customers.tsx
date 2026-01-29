'use client';
import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  currentStep: number;
  convertedAt: string;
  companies: { companyName: string }[];
}

interface CustomersProps {
  onViewCustomer: (id: string) => void;
}

export default function Customers({ onViewCustomer }: CustomersProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(c => 
    `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dtax-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
        <p className="text-gray-500">{customers.length} aktive kunder</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Søk etter kunde..."
              className="form-input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="table-container">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Ingen kunder ennå</p>
              <p className="text-sm text-gray-400 mt-2">Kunder vises her når prospekter konverteres</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>E-post</th>
                  <th>Telefon</th>
                  <th>Selskap</th>
                  <th>Kunde siden</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr 
                    key={customer.id} 
                    onClick={() => onViewCustomer(customer.id)}
                    className="cursor-pointer"
                  >
                    <td className="font-medium">{customer.firstName} {customer.lastName}</td>
                    <td>{customer.email || '-'}</td>
                    <td>{customer.phone || '-'}</td>
                    <td>{customer.companies[0]?.companyName || '-'}</td>
                    <td>{customer.convertedAt ? new Date(customer.convertedAt).toLocaleDateString('nb-NO') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
