export interface User {
  id: number
  username: string
  email: string
  avatar: string | null
  role: 'student' | 'teacher' | 'admin'
  level: number
  experience: number
  points: number
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Course {
  id: number
  title: string
  description: string
  cover_image: string | null
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  teacher_id: number
  duration: number
  price: number
  status: 'draft' | 'published' | 'archived'
  enrollment_count: number
  rating: number
  created_at: string
  updated_at: string
  teacher_name?: string
  teacher_avatar?: string
  isEnrolled?: boolean
}

export interface CourseDetail extends Course {
  chapters: Chapter[]
  userProgress?: number
  isCompleted?: boolean
}

export interface Chapter {
  id: number
  course_id: number
  title: string
  description: string
  order: number
  lessons?: Lesson[]
  created_at: string
}

export interface Lesson {
  id: number
  chapter_id: number
  title: string
  content: string
  video_url: string | null
  duration: number
  order: number
  is_free: boolean
  created_at: string
}

export interface Problem {
  id: number
  title: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  tags: string[]
  input_format: string
  output_format: string
  examples: ProblemExample[]
  constraints: string
  hints: string[]
  time_limit: number
  memory_limit: number
  template_code: Record<string, string>
  created_by: number
  status: 'draft' | 'published' | 'archived'
  submission_count: number
  accepted_count: number
  acceptance_rate?: number
  created_at: string
  updated_at: string
}

export interface ProblemExample {
  input: string
  output: string
  explanation?: string
}

export interface Submission {
  id: number
  user_id: number
  problem_id: number
  language: string
  code: string
  status: 'pending' | 'running' | 'accepted' | 'wrong_answer' | 'time_limit_exceeded' | 'memory_limit_exceeded' | 'runtime_error' | 'compilation_error'
  runtime: number | null
  memory: number | null
  test_results: TestResult[]
  error_message: string | null
  submitted_at: string
  problem_title?: string
  difficulty?: string
}

export interface TestResult {
  status: string
  runtime: number
  memory: number
  output: string
  expected: string
}

export interface Post {
  id: number
  title: string
  content: string
  author_id: number
  category: 'question' | 'article' | 'discussion'
  tags: string[]
  view_count: number
  like_count: number
  comment_count: number
  is_pinned: boolean
  status: 'draft' | 'published' | 'hidden'
  created_at: string
  updated_at: string
  author_name?: string
  author_avatar?: string
  author_level?: number
}

export interface Comment {
  id: number
  post_id: number
  user_id: number
  parent_id: number | null
  content: string
  like_count: number
  is_liked?: boolean
  is_pinned?: boolean
  created_at: string
  author_name?: string
  author_avatar?: string
  author_level?: number
}

export interface UserProgress {
  course_id: number
  course_title: string
  progress: number
  completed: boolean
  enrolled_at: string
}

export interface UserStats {
  enrolledCourses: number
  totalSubmissions: number
  acceptedSubmissions: number
}
