-- Create appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  appointment_type TEXT NOT NULL DEFAULT 'consultation',
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'tax_preparation',
  price NUMERIC NOT NULL,
  duration_estimate TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create staff table (for dashboard users beyond agents)
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'staff',
  department TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Add demo policies for all tables
CREATE POLICY "Allow public read for demo" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert for demo" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.appointments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.appointments FOR DELETE USING (true);

CREATE POLICY "Allow public read for demo" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public insert for demo" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.services FOR DELETE USING (true);

CREATE POLICY "Allow public read for demo" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Allow public insert for demo" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.staff FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.staff FOR DELETE USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data for appointments
INSERT INTO public.appointments (client_id, agent_id, title, appointment_type, scheduled_at, duration_minutes, status, location) 
SELECT 
  c.id,
  a.id,
  'Initial Tax Consultation',
  'consultation',
  NOW() + INTERVAL '2 days',
  60,
  'scheduled',
  'Office - Room 101'
FROM public.clients c, public.agents a
LIMIT 1;

INSERT INTO public.appointments (client_id, title, appointment_type, scheduled_at, duration_minutes, status, location) 
SELECT 
  id,
  'Document Review Meeting',
  'review',
  NOW() + INTERVAL '5 days',
  30,
  'confirmed',
  'Virtual - Zoom'
FROM public.clients
LIMIT 1 OFFSET 1;

INSERT INTO public.appointments (client_id, title, appointment_type, scheduled_at, duration_minutes, status) 
SELECT 
  id,
  'Tax Return Signing',
  'signing',
  NOW() - INTERVAL '1 day',
  15,
  'completed'
FROM public.clients
LIMIT 1 OFFSET 2;

-- Insert sample services
INSERT INTO public.services (name, description, category, price, duration_estimate, is_active) VALUES
('Individual Tax Return (Simple)', 'Basic 1040 filing for W-2 employees', 'individual', 150.00, '1-2 days', true),
('Individual Tax Return (Complex)', 'Itemized deductions, investments, rental income', 'individual', 350.00, '3-5 days', true),
('Small Business Tax Return', 'Schedule C, sole proprietorship filing', 'business', 500.00, '5-7 days', true),
('Corporate Tax Return (1120)', 'Full corporate tax preparation and filing', 'corporate', 1500.00, '2-3 weeks', true),
('Tax Consultation (1 Hour)', 'Professional tax advice and planning', 'consultation', 100.00, '1 hour', true),
('IRS Audit Representation', 'Full representation during IRS audit', 'specialty', 2500.00, 'Varies', true);

-- Insert sample staff
INSERT INTO public.staff (full_name, email, phone, role, department, status) VALUES
('Admin User', 'admin@taxcana.com', '(416) 555-0001', 'superadmin', 'Administration', 'active'),
('Reception Desk', 'reception@taxcana.com', '(416) 555-0002', 'staff', 'Front Office', 'active'),
('John Bookkeeper', 'john.bookkeeper@taxcana.com', '(416) 555-0003', 'staff', 'Accounting', 'active');