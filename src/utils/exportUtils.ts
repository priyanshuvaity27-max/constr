import { User, Lead, Developer, Entity, Enquiry } from '../types';

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Handle arrays (like skills)
        if (Array.isArray(value)) {
          return `"${value.join('; ')}"`;
        }
        // Handle strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadTemplate = (type: 'users' | 'leads' | 'developers' | 'entities' | 'enquiries') => {
  let headers: string[] = [];
  let sampleData: any = {};

  switch (type) {
    case 'users':
      headers = ['name', 'email', 'phone', 'role', 'status'];
      sampleData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        role: 'employee',
        status: 'active'
      };
      break;
    case 'leads':
      headers = ['clientName', 'contact', 'email', 'source', 'projectType', 'status', 'remarks', 'budget', 'location'];
      sampleData = {
        clientName: 'ABC Corp',
        contact: '9876543210',
        email: 'abc@example.com',
        source: 'Website',
        projectType: 'Commercial',
        status: 'New',
        remarks: 'High priority',
        budget: '5000000',
        location: 'Mumbai'
      };
      break;
    case 'developers':
      headers = ['name', 'email', 'phone', 'skills', 'experience', 'projectsHandled', 'status'];
      sampleData = {
        name: 'Jane Developer',
        email: 'jane@example.com',
        phone: '9876543210',
        skills: 'React; Node.js; MongoDB',
        experience: '3 years',
        projectsHandled: '5',
        status: 'active'
      };
      break;
    case 'entities':
      headers = ['type', 'name', 'location', 'area', 'startDate', 'endDate', 'status', 'description', 'budget'];
      sampleData = {
        type: 'Project',
        name: 'Sample Project',
        location: 'Mumbai',
        area: '1000 sq ft',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        status: 'Planning',
        description: 'Sample description',
        budget: '2000000'
      };
      break;
    case 'enquiries':
      headers = ['name', 'email', 'phone', 'message', 'source', 'status'];
      sampleData = {
        name: 'Customer Name',
        email: 'customer@example.com',
        phone: '9876543210',
        message: 'Interested in your services',
        source: 'Website',
        status: 'New'
      };
      break;
  }

  const csvContent = [
    headers.join(','),
    headers.map(header => sampleData[header] || '').join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${type}_template.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};