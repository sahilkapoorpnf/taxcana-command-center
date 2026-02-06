-- Add public read policies for demo mode (bypassed auth)
-- These allow reading data without authentication for demonstration purposes

-- Clients - allow public read
CREATE POLICY "Allow public read for demo" ON public.clients FOR SELECT USING (true);

-- Agents - allow public read
CREATE POLICY "Allow public read for demo" ON public.agents FOR SELECT USING (true);

-- Tax Returns - allow public read
CREATE POLICY "Allow public read for demo" ON public.tax_returns FOR SELECT USING (true);

-- Documents - allow public read
CREATE POLICY "Allow public read for demo" ON public.documents FOR SELECT USING (true);

-- Payments - allow public read
CREATE POLICY "Allow public read for demo" ON public.payments FOR SELECT USING (true);

-- Also add insert/update/delete policies for demo CRUD operations
CREATE POLICY "Allow public insert for demo" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Allow public insert for demo" ON public.agents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.agents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.agents FOR DELETE USING (true);

CREATE POLICY "Allow public insert for demo" ON public.tax_returns FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.tax_returns FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.tax_returns FOR DELETE USING (true);

CREATE POLICY "Allow public insert for demo" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Allow public insert for demo" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update for demo" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete for demo" ON public.payments FOR DELETE USING (true);