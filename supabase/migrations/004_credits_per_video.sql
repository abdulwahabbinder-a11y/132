-- 5 credits = 1 video | Free: 5 credits (1 video) | Pro: 30 credits (6 videos)

ALTER TABLE public.subscriptions
  ALTER COLUMN video_credits_left SET DEFAULT 5;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    INSERT INTO public.subscriptions (user_id, plan_type, video_credits_left)
    VALUES (NEW.id, 'free', 5);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bump existing free users below 5 up to 5 (one-time alignment)
UPDATE public.subscriptions
SET video_credits_left = 5, updated_at = NOW()
WHERE plan_type = 'free' AND video_credits_left < 5;
