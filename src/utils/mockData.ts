import { User, Lead, Developer, Contact, LandParcel, ProjectMaster, InventoryItem } from '../types';

export const initializeMockData = () => {
  // Initialize users if not exists
  if (!localStorage.getItem('users')) {
    const users: User[] = [
      {
        id: '1',
        name: 'Admin User',
        username: 'admin',
        password: 'admin123',
        email: 'admin@construction.com',
        mobileNo: '9876543210',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01',
      },
      {
        id: '2',
        name: 'John Manager',
        username: 'john',
        password: 'john123',
        email: 'john@construction.com', 
        mobileNo: '9876543211',
        role: 'employee',
        status: 'active',
        createdAt: '2024-01-02',
      },
      {
        id: '3',
        name: 'Sarah Employee',
        username: 'sarah',
        password: 'sarah123',
        email: 'sarah@construction.com',
        mobileNo: '9876543212',
        role: 'employee',
        status: 'active',
        createdAt: '2024-01-03',
      },
    ];
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Initialize leads if not exists
  if (!localStorage.getItem('leads')) {
    const leads: Lead[] = [
      {
        id: '1',
        inquiryNo: 'LEAD-001',
        inquiryDate: '2024-01-15',
        clientCompany: 'ABC Corporation',
        contactPerson: 'Rajesh Kumar',
        contactNo: '9876543210',
        email: 'rajesh@abc.com',
        designation: 'Manager',
        typeOfPlace: 'Office',
        spaceRequirement: '5000 sq ft',
        transactionType: 'Lease',
        budget: 5000000,
        city: 'Mumbai',
        locationPreference: 'Andheri East',
        firstContactDate: '2024-01-15',
        leadManagedBy: '2',
        leadManagerName: 'John Manager',
        status: 'In Progress',
        optionShared: 'Yes',
        lastContactDate: '2024-01-20',
        nextActionPlan: 'Follow up on proposal sent',
        actionDate: '2024-01-25',
        remark: 'High priority client',
        createdAt: '2024-01-15',
      },
      {
        id: '2',
        inquiryNo: 'LEAD-002',
        inquiryDate: '2024-01-20',
        clientCompany: 'XYZ Retail',
        contactPerson: 'Priya Sharma',
        contactNo: '9876543220',
        email: 'priya@xyz.com',
        designation: 'Director',
        typeOfPlace: 'Retail',
        spaceRequirement: '2000 sq ft',
        transactionType: 'Sale',
        budget: 3000000,
        city: 'Pune',
        locationPreference: 'Koregaon Park',
        firstContactDate: '2024-01-20',
        leadManagedBy: '3',
        leadManagerName: 'Sarah Employee',
        status: 'New',
        optionShared: 'No',
        lastContactDate: '2024-01-20',
        nextActionPlan: 'Schedule site visit',
        actionDate: '2024-01-22',
        remark: 'Initial discussion completed',
        createdAt: '2024-01-20',
      },
    ];
    localStorage.setItem('leads', JSON.stringify(leads));
  }

  // Initialize developers if not exists
  if (!localStorage.getItem('developers')) {
    const developers: Developer[] = [
      {
        id: '1',
        type: 'corporate',
        developerName: 'DLF Limited',
        grade: 'A',
        commonContact: 'Amit Singh',
        emailId: 'amit@dlf.com',
        websiteLink: 'https://www.dlf.in',
        linkedInLink: 'https://linkedin.com/company/dlf',
        hoCity: 'Delhi',
        presenceCity: ['Delhi', 'Mumbai', 'Bangalore', 'Chennai'],
        noOfBuildings: 150,
        createdAt: '2024-01-02',
      },
      {
        id: '2',
        type: 'coworking',
        developerName: 'WeWork India',
        grade: 'A',
        commonContact: 'Neha Patel',
        emailId: 'neha@wework.com',
        websiteLink: 'https://www.wework.com/en-IN',
        linkedInLink: 'https://linkedin.com/company/wework',
        hoCity: 'Mumbai',
        presenceCity: ['Mumbai', 'Delhi', 'Bangalore', 'Pune'],
        noOfCoworking: 45,
        createdAt: '2024-01-04',
      },
    ];
    localStorage.setItem('developers', JSON.stringify(developers));
  }

  // Initialize contacts if not exists
  if (!localStorage.getItem('contacts')) {
    const contacts: Contact[] = [
      {
        id: '1',
        category: 'client',
        companyName: 'Tech Solutions Pvt Ltd',
        industry: 'Technology',
        contactPerson: 'Vikram Mehta',
        designation: 'CEO',
        contactNo: '9876543230',
        alternateNo: '9876543231',
        emailId: 'vikram@techsolutions.com',
        linkedInLink: 'https://linkedin.com/in/vikram-mehta',
        city: 'Mumbai',
        location: 'Powai',
        createdAt: '2024-01-25',
      },
      {
        id: '2',
        category: 'developer',
        developerName: 'Godrej Properties',
        type: 'Real Estate',
        contactPerson: 'Ravi Gupta',
        designation: 'Project Manager',
        contactNo: '9876543240',
        alternateNo: '9876543241',
        emailId: 'ravi@godrej.com',
        linkedInLink: 'https://linkedin.com/in/ravi-gupta',
        city: 'Mumbai',
        location: 'Vikhroli',
        createdAt: '2024-01-26',
      },
    ];
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }

  // Initialize land parcels if not exists
  if (!localStorage.getItem('landParcels')) {
    const landParcels: LandParcel[] = [
      {
        id: '1',
        landParcelName: 'Panvel Commercial Plot',
        location: 'Panvel',
        city: 'Navi Mumbai',
        googleLocation: 'https://maps.google.com/panvel',
        areaInSqm: 5000,
        zone: 'Commercial',
        title: 'Clear Title',
        roadWidth: '60 feet',
        connectivity: 'Highway access, Metro connectivity',
        advantages: 'Prime location, good infrastructure',
        documents: {
          propertyCard: { uploaded: true, fileName: 'property_card_001.pdf' },
          googleLocationMapping: { uploaded: true, fileName: 'location_map_001.pdf' },
          plotLayout: { uploaded: false },
          dpRemark: { uploaded: true, fileName: 'dp_remark_001.pdf' },
          surveyTitle: { uploaded: false },
          iod: { uploaded: false },
          noc: { uploaded: true, fileName: 'noc_001.pdf' },
        },
        createdAt: '2024-01-10',
      },
    ];
    localStorage.setItem('landParcels', JSON.stringify(landParcels));
  }

  // Initialize projects if not exists
  if (!localStorage.getItem('projects')) {
    const projects: ProjectMaster[] = [
      {
        id: '1',
        type: 'corporate_building',
        name: 'DLF Cyber City',
        grade: 'A',
        developerOwner: 'DLF Limited',
        contactNo: '+91 9876543210',
        alternateNo: '+91 9876543211',
        email: 'contact@dlf.com',
        city: 'Gurgaon',
        location: 'Cyber City',
        googleLocation: 'https://maps.google.com/dlf-cyber-city',
        noOfFloors: 25,
        floorPlate: '25000 sq ft',
        rentPerSqft: 85,
        camPerSqft: 15,
        amenities: 'Parking, Security, Power Backup, Cafeteria',
        remark: 'Premium corporate building',
        status: 'Active',
        createdAt: '2024-01-15',
      },
    ];
    localStorage.setItem('projects', JSON.stringify(projects));
  }

  // Initialize inventory if not exists
  if (!localStorage.getItem('inventory')) {
    const inventory: InventoryItem[] = [
      {
        id: '1',
        type: 'corporate_building',
        name: 'Tower A - Floor 15',
        grade: 'A',
        developerOwnerName: 'DLF Limited',
        contactNo: '+91 9876543210',
        alternateContactNo: '+91 9876543211',
        emailId: 'leasing@dlf.com',
        city: 'Gurgaon',
        location: 'Cyber City',
        googleLocation: 'https://maps.google.com/dlf-tower-a',
        saleableArea: '5000 sq ft',
        carpetArea: '4200 sq ft',
        floor: '15th Floor',
        height: '12 feet',
        terrace: 'No',
        type: 'Office Space',
        specification: 'Fully furnished office space with modern amenities',
        status: 'Available',
        rentPerSqft: 85,
        camPerSqft: 15,
        agreementPeriod: '3 years',
        lockInPeriod: '1 year',
        noOfCarParks: 10,
        createdAt: '2024-01-20',
      },
    ];
    localStorage.setItem('inventory', JSON.stringify(inventory));
  }
};