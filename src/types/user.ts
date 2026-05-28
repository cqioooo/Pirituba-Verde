export interface User {
  id: string;
  email: string;
  fullName: string;
  cpf: string;
  dateOfBirth: string;
  neighborhood: string;
  street: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserMetadata {
  full_name: string;
  cpf: string;
  date_of_birth: string;
  neighborhood: string;
  street: string;
  phone: string;
}
