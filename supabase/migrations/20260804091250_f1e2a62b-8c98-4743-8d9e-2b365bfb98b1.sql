
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('student','alumni');
CREATE TYPE public.question_status AS ENUM ('unanswered','solved');
CREATE TYPE public.connect_topic AS ENUM ('internship','resume','placement','project','other');
CREATE TYPE public.connect_status AS ENUM ('pending','accepted','declined','expired');
CREATE TYPE public.slot_status AS ENUM ('open','booked','cancelled');
CREATE TYPE public.opening_category AS ENUM ('internship','job','hackathon','research');
CREATE TYPE public.referral_status AS ENUM ('requested','accepted','declined','referred');
CREATE TYPE public.story_tag AS ENUM ('placement_journey','career_advice','life_at_company','higher_studies');
CREATE TYPE public.resource_category AS ENUM ('aptitude','coding_sheet','resume_template','interview_questions','department_notes');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  name TEXT NOT NULL DEFAULT '',
  email TEXT,
  branch TEXT,
  year INT,
  batch TEXT,
  company TEXT,
  job_title TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  helping_with TEXT[] NOT NULL DEFAULT '{}',
  bio TEXT,
  avatar_url TEXT,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by members" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ROLES (separate table, source of truth for permissions)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles readable by members" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- can host mentorship (alumni or 4th year student)
CREATE OR REPLACE FUNCTION public.can_host(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND (p.role = 'alumni' OR p.year >= 4)
  )
$$;

-- signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.app_role;
BEGIN
  r := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'student');
  INSERT INTO public.profiles (id, role, name, email, branch, year, batch, company, job_title)
  VALUES (
    NEW.id, r,
    COALESCE(NEW.raw_user_meta_data->>'name',''),
    NEW.email,
    NEW.raw_user_meta_data->>'branch',
    NULLIF(NEW.raw_user_meta_data->>'year','')::int,
    NEW.raw_user_meta_data->>'batch',
    NEW.raw_user_meta_data->>'company',
    NEW.raw_user_meta_data->>'job_title'
  ) ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r) ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- QUESTIONS
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  status public.question_status NOT NULL DEFAULT 'unanswered',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions readable" ON public.questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions insert own" ON public.questions FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "questions update own" ON public.questions FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "questions delete own" ON public.questions FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- ANSWERS
CREATE TABLE public.answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  upvotes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "answers readable" ON public.answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "answers insert own" ON public.answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "answers update own" ON public.answers FOR UPDATE TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "answers delete own" ON public.answers FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE TABLE public.answer_votes (
  answer_id UUID NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (answer_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.answer_votes TO authenticated;
GRANT ALL ON public.answer_votes TO service_role;
ALTER TABLE public.answer_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "votes readable" ON public.answer_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "votes insert own" ON public.answer_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "votes delete own" ON public.answer_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_answer_upvotes()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.answers a
  SET upvotes = (SELECT count(*) FROM public.answer_votes v WHERE v.answer_id = a.id)
  WHERE a.id = COALESCE(NEW.answer_id, OLD.answer_id);
  RETURN NULL;
END; $$;
CREATE TRIGGER answer_votes_sync AFTER INSERT OR DELETE ON public.answer_votes
FOR EACH ROW EXECUTE FUNCTION public.sync_answer_upvotes();

-- CONNECT REQUESTS
CREATE TABLE public.connect_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic public.connect_topic NOT NULL DEFAULT 'other',
  note TEXT,
  status public.connect_status NOT NULL DEFAULT 'pending',
  archived BOOLEAN NOT NULL DEFAULT false,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.connect_requests TO authenticated;
GRANT ALL ON public.connect_requests TO service_role;
ALTER TABLE public.connect_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr readable by participants" ON public.connect_requests FOR SELECT TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "cr insert own" ON public.connect_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = from_user_id AND public.can_host(to_user_id));
CREATE POLICY "cr update by participants" ON public.connect_requests FOR UPDATE TO authenticated
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- MESSAGES
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connect_request_id UUID NOT NULL REFERENCES public.connect_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_thread_participant(_cr UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.connect_requests c
    WHERE c.id = _cr AND c.status = 'accepted' AND c.archived = false
      AND (c.from_user_id = _user OR c.to_user_id = _user)
  )
$$;
CREATE POLICY "messages readable by participants" ON public.messages FOR SELECT TO authenticated
  USING (public.is_thread_participant(connect_request_id, auth.uid()));
CREATE POLICY "messages insert by participants" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_thread_participant(connect_request_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.bump_thread_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.connect_requests SET last_activity_at = now() WHERE id = NEW.connect_request_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_bump AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.bump_thread_activity();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- OFFICE HOURS
CREATE TABLE public.office_hour_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 30,
  start_time TIMESTAMPTZ,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  day_of_week INT,
  status public.slot_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.office_hour_slots TO authenticated;
GRANT ALL ON public.office_hour_slots TO service_role;
ALTER TABLE public.office_hour_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "slots readable" ON public.office_hour_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "slots insert host" ON public.office_hour_slots FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id AND public.can_host(auth.uid()));
CREATE POLICY "slots update host" ON public.office_hour_slots FOR UPDATE TO authenticated
  USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
CREATE POLICY "slots delete host" ON public.office_hour_slots FOR DELETE TO authenticated USING (auth.uid() = host_id);

CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES public.office_hour_slots(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_slot_host(_slot UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.office_hour_slots s WHERE s.id = _slot AND s.host_id = _user)
$$;
CREATE POLICY "bookings readable by parties" ON public.bookings FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.is_slot_host(slot_id, auth.uid()));
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "bookings delete own" ON public.bookings FOR DELETE TO authenticated USING (auth.uid() = student_id);

CREATE OR REPLACE FUNCTION public.mark_slot_booked()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.office_hour_slots SET status = 'booked' WHERE id = NEW.slot_id;
  RETURN NEW;
END; $$;
CREATE TRIGGER bookings_mark_slot AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.mark_slot_booked();

-- OPENINGS
CREATE TABLE public.openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  role TEXT NOT NULL,
  eligibility TEXT,
  package TEXT,
  deadline DATE,
  apply_link TEXT,
  category public.opening_category NOT NULL DEFAULT 'job',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.openings TO authenticated;
GRANT ALL ON public.openings TO service_role;
ALTER TABLE public.openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "openings readable" ON public.openings FOR SELECT TO authenticated USING (true);
CREATE POLICY "openings write own" ON public.openings FOR ALL TO authenticated
  USING (auth.uid() = alumni_id) WITH CHECK (auth.uid() = alumni_id);

-- REFERRAL OFFERS
CREATE TABLE public.referral_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company TEXT NOT NULL,
  domain TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_offers TO authenticated;
GRANT ALL ON public.referral_offers TO service_role;
ALTER TABLE public.referral_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offers readable" ON public.referral_offers FOR SELECT TO authenticated USING (true);
CREATE POLICY "offers write own" ON public.referral_offers FOR ALL TO authenticated
  USING (auth.uid() = alumni_id) WITH CHECK (auth.uid() = alumni_id);

-- REFERRAL REQUESTS
CREATE TABLE public.referral_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES public.referral_offers(id) ON DELETE SET NULL,
  opening_id UUID REFERENCES public.openings(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resume_url TEXT,
  why_note TEXT NOT NULL,
  status public.referral_status NOT NULL DEFAULT 'requested',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.referral_requests TO authenticated;
GRANT ALL ON public.referral_requests TO service_role;
ALTER TABLE public.referral_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rr readable by parties" ON public.referral_requests FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = alumni_id);
CREATE POLICY "rr insert own" ON public.referral_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
CREATE POLICY "rr update by parties" ON public.referral_requests FOR UPDATE TO authenticated
  USING (auth.uid() = student_id OR auth.uid() = alumni_id)
  WITH CHECK (auth.uid() = student_id OR auth.uid() = alumni_id);

-- STORIES
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumni_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  tag public.story_tag NOT NULL DEFAULT 'career_advice',
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories readable" ON public.stories FOR SELECT TO authenticated USING (true);
CREATE POLICY "stories write own" ON public.stories FOR ALL TO authenticated
  USING (auth.uid() = alumni_id) WITH CHECK (auth.uid() = alumni_id);

-- RESOURCES
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category public.resource_category NOT NULL,
  branch TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources readable" ON public.resources FOR SELECT TO authenticated USING (true);

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connect_request_id UUID REFERENCES public.connect_requests(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports readable own" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "reports insert own" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- archive helper (45 days inactivity)
CREATE OR REPLACE FUNCTION public.archive_stale_threads()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.connect_requests
  SET archived = true
  WHERE status = 'accepted' AND archived = false AND last_activity_at < now() - interval '45 days';
$$;
