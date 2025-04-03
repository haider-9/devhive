"use client";

import { useState, useEffect, useRef } from "react";
import { account, ID, storage } from "@/appwrite";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import {
  Button,
  Input,
  CardBody,
  CardHeader,
  Avatar,
  Card,
  Divider,
  Tabs,
  Tab,
  Spinner,
} from "@nextui-org/react";
import {
  LuCamera,
  LuX,
  LuImage,
  LuUser,
  LuAtSign,
  LuLock,
  LuUserPlus,
  LuShieldCheck,
  LuLogIn,
  LuGithub,
  LuHelpCircle,
} from "react-icons/lu";
import { FcGoogle } from "react-icons/fc";
import { motion, AnimatePresence } from "framer-motion";
import {
  HUMOR_LINE_SWITCH_INTERVAL,
  SIGNIN_HUMOR_LINES,
  SIGNUP_HUMOR_LINES,
} from "@/constants";

const signinSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email address")
    .min(1, "Email is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long"),
});

const signupSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username is too long")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Only letters, numbers and underscores allowed"
      ),
    email: z
      .string()
      .email("Please enter a valid email address")
      .min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(50, "Password is too long")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function AuthPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [humorLine, setHumorLine] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const signinForm = useForm({
    resolver: zodResolver(signinSchema),
    mode: "onChange",
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
  });

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await account.get();
        setLoggedInUser(user);
        if (user.prefs?.profileImageId) {
          setAvatarPreview(
            storage.getFileView(
              process.env.NEXT_PUBLIC_BUCKET_ID,
              user.prefs.profileImageId
            ).href
          );
        }
        document.cookie = `user=${JSON.stringify(user)}`;
        router.push("/"); // Redirect if already logged in
      } catch (error) {
        
      }
    };
    checkSession();
  }, [router]);

  // Rotate humorous messages
  useEffect(() => {
    const getRandomHumorLine = () => {
      const lines = isLoginView ? SIGNIN_HUMOR_LINES : SIGNUP_HUMOR_LINES;
      const randomIndex = Math.floor(Math.random() * lines.length);
      return lines[randomIndex];
    };

    setHumorLine(getRandomHumorLine());

    const intervalId = setInterval(() => {
      setHumorLine(getRandomHumorLine());
    }, HUMOR_LINE_SWITCH_INTERVAL);

    return () => clearInterval(intervalId);
  }, [isLoginView]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (JPEG, PNG, etc.)");
      return;
    }

    setProfileImage(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Cover image must be less than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setCoverPreview(URL.createObjectURL(file));
  };

  const handleAvatarDelete = () => {
    setAvatarPreview(null);
    setProfileImage(null);
  };

  const handleCoverDelete = () => {
    setCoverPreview(null);
  };

  const handleOAuthSignIn = async (provider) => {
    try {
      await account.createOAuth2Session(
        provider,
        `${window.location.origin}/`,
        `${window.location.origin}/start`
      );
      toast.success(
        `Signed in with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`
      );
    } catch (error) {
      toast.error(
        error?.message ||
          `Unable to sign in with ${provider}. Please try again.`
      );
      console.error(`${provider} sign-in error:`, error);
    }
  };

  const onSignIn = async (data) => {
    setLoading(true);
    try {
      // Clear any existing session
      try {
        await account.deleteSession("current");
      } catch (error) {}

      await account.createEmailPasswordSession(data.email, data.password);
      const user = await account.get();
      setLoggedInUser(user);

      if (user.prefs?.profileImageId) {
        setAvatarPreview(
          storage.getFileView(
            process.env.NEXT_PUBLIC_BUCKET_ID,
            user.prefs.profileImageId
          ).href
        );
      }

      toast.success(`Welcome back, ${user.name}!`);
      router.push("/");
    } catch (err) {
      toast.error(
        err.message || "Invalid email or password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onSignUp = async (data) => {
    setLoading(true);
    try {
      // Create user account
      const user = await account.create(
        ID.unique(),
        data.email,
        data.password,
        data.username
      );

      // Upload profile image if provided
      let imageId = null;
      if (profileImage) {
        setLoadingImage(true);
        const response = await storage.createFile(
          process.env.NEXT_PUBLIC_BUCKET_ID,
          ID.unique(),
          profileImage,
          [`read("user:${user.$id}")`, `write("user:${user.$id}")`]
        );
        imageId = response.$id;
      }

      // Update user preferences with image ID
      if (imageId) {
        await account.updatePrefs({
          profileImageId: imageId,
        });
      }

      // Log user in automatically
      await account.createEmailPasswordSession(data.email, data.password);
      const loggedUser = await account.get();
      setLoggedInUser(loggedUser);

      toast.success(`Welcome, ${data.username}! Account created successfully.`);
      router.push("/");
    } catch (err) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
      setLoadingImage(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: "12px",
            padding: "16px",
          },
        }}
      />

      <div className="w-full max-w-md">
        <Tabs
          selectedKey={isLoginView ? "signin" : "signup"}
          onSelectionChange={(key) => {
            setIsLoginView(key === "signin");
            // Reset forms when switching tabs
            signinForm.reset();
            signupForm.reset();
          }}
          aria-label="Authentication tabs"
          className="w-full"
          color="warning"
          variant="underlined"
        >
          {/* Sign In Tab */}
          <Tab
            key="signin"
            title={
              <div className="flex items-center space-x-2">
                <LuLogIn size={18} />
                <span>Sign In</span>
              </div>
            }
          >
            <Card className="shadow-lg border border-default-100">
              <CardHeader className="flex flex-col items-center pb-0 pt-6">
                <h1 className="text-2xl font-bold text-warning">
                  Welcome Back!
                </h1>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={humorLine}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-center text-foreground/70 mt-2 h-6"
                  >
                    {humorLine}
                  </motion.p>
                </AnimatePresence>
              </CardHeader>

              <CardBody className="p-6">
                <div className="space-y-6">
                  {/* OAuth Buttons */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground/80">
                      Continue with
                    </p>
                    <div className="flex gap-3">
                      <Button
                        fullWidth
                        variant="flat"
                        onClick={() => handleOAuthSignIn("google")}
                        startContent={<FcGoogle size={20} />}
                        className="font-medium"
                      >
                        Google
                      </Button>
                      <Button
                        fullWidth
                        variant="flat"
                        onClick={() => handleOAuthSignIn("github")}
                        startContent={<LuGithub size={20} />}
                        className="font-medium"
                      >
                        GitHub
                      </Button>
                    </div>
                  </div>

                  <Divider className="my-4" />

                  {/* Email/Password Form */}
                  <form
                    onSubmit={signinForm.handleSubmit(onSignIn)}
                    className="space-y-4"
                  >
                    <Input
                      type="email"
                      label="Email address"
                      placeholder="Enter your email"
                      {...signinForm.register("email")}
                      isInvalid={!!signinForm.formState.errors.email}
                      errorMessage={signinForm.formState.errors.email?.message}
                      startContent={<LuAtSign className="text-default-400" />}
                      classNames={{
                        inputWrapper: "border border-default-200",
                      }}
                      autoComplete="email"
                    />

                    <Input
                      type={passwordVisible ? "text" : "password"}
                      label="Password"
                      placeholder="Enter your password"
                      {...signinForm.register("password")}
                      isInvalid={!!signinForm.formState.errors.password}
                      errorMessage={
                        signinForm.formState.errors.password?.message
                      }
                      startContent={<LuLock className="text-default-400" />}
                      endContent={
                        <button
                          type="button"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="focus:outline-none"
                          aria-label={
                            passwordVisible ? "Hide password" : "Show password"
                          }
                        >
                          {passwordVisible ? (
                            <LuHelpCircle className="text-default-400" />
                          ) : (
                            <LuHelpCircle className="text-default-400" />
                          )}
                        </button>
                      }
                      classNames={{
                        inputWrapper: "border border-default-200",
                      }}
                      autoComplete="current-password"
                    />

                    <div className="flex justify-end">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-warning hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      color="warning"
                      size="lg"
                      isDisabled={!signinForm.formState.isValid || loading}
                      isLoading={loading}
                      fullWidth
                      className="font-medium"
                    >
                      {loading ? (
                        <Spinner size="sm" color="white" />
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>

                  <div className="text-center text-sm">
                    <span className="text-foreground/70">
                      Don't have an account?{" "}
                    </span>
                    <Button
                      variant="light"
                      size="sm"
                      className="text-warning p-0 min-w-fit h-fit"
                      onClick={() => setIsLoginView(false)}
                    >
                      Sign up
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Tab>

          {/* Sign Up Tab */}
          <Tab
            key="signup"
            title={
              <div className="flex items-center space-x-2">
                <LuUserPlus size={18} />
                <span>Sign Up</span>
              </div>
            }
          >
            <Card className="border border-default-100 shadow-lg overflow-hidden">
              {/* Cover Photo Section */}
              <CardHeader className="relative p-0 h-40 bg-gradient-to-r from-primary to-warning">
                {coverPreview ? (
                  <>
                    <img
                      src={coverPreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      radius="full"
                      variant="flat"
                      className="absolute top-2 right-2 backdrop-blur-md bg-black/30 text-white"
                      onClick={handleCoverDelete}
                      aria-label="Remove cover photo"
                    >
                      <LuX />
                    </Button>
                  </>
                ) : (
                  <label
                    htmlFor="cover-upload"
                    className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/10 transition-colors"
                  >
                    <div className="flex flex-col items-center text-white/80 hover:text-white">
                      <LuImage size={24} />
                      <span className="text-xs mt-1">Add cover photo</span>
                    </div>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Avatar Section */}
                <div className="absolute -bottom-16 left-6">
                  <div className="relative">
                    <Avatar
                      src={avatarPreview}
                      className="w-32 h-32 border-4 border-content1"
                      showFallback
                      fallback={
                        <LuUser size={48} className="text-default-400" />
                      }
                    />

                    <label
                      htmlFor="avatar-upload"
                      className="absolute bottom-0 right-0 bg-warning rounded-full p-2 cursor-pointer hover:bg-warning/90 transition-colors"
                      aria-label="Upload profile picture"
                    >
                      <LuCamera className="w-5 h-5 text-white" />
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />

                    {avatarPreview && (
                      <Button
                        isIconOnly
                        size="sm"
                        radius="full"
                        variant="flat"
                        className="absolute top-0 right-0 backdrop-blur-md bg-black/30 text-white"
                        onClick={handleAvatarDelete}
                        aria-label="Remove profile picture"
                      >
                        <LuX />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardBody className="pt-20 px-6 pb-6">
                <h2 className="text-2xl font-bold text-foreground">
                  Create Account
                </h2>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={humorLine}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-foreground/70 mt-1 mb-4 h-6"
                  >
                    {humorLine}
                  </motion.p>
                </AnimatePresence>

                <form
                  onSubmit={signupForm.handleSubmit(onSignUp)}
                  className="space-y-4"
                >
                  <Input
                    type="text"
                    label="Username"
                    placeholder="Choose a username"
                    description="3-20 characters, letters, numbers and underscores"
                    {...signupForm.register("username")}
                    isInvalid={!!signupForm.formState.errors.username}
                    errorMessage={signupForm.formState.errors.username?.message}
                    startContent={<LuUser className="text-default-400" />}
                    classNames={{
                      inputWrapper: "border border-default-200",
                    }}
                    autoComplete="username"
                  />

                  <Input
                    type="email"
                    label="Email address"
                    placeholder="Enter your email"
                    {...signupForm.register("email")}
                    isInvalid={!!signupForm.formState.errors.email}
                    errorMessage={signupForm.formState.errors.email?.message}
                    startContent={<LuAtSign className="text-default-400" />}
                    classNames={{
                      inputWrapper: "border border-default-200",
                    }}
                    autoComplete="email"
                  />

                  <Input
                    type={passwordVisible ? "text" : "password"}
                    label="Password"
                    placeholder="Create a password"
                    description="At least 8 characters with uppercase, lowercase and number"
                    {...signupForm.register("password")}
                    isInvalid={!!signupForm.formState.errors.password}
                    errorMessage={signupForm.formState.errors.password?.message}
                    startContent={<LuLock className="text-default-400" />}
                    endContent={
                      <button
                        type="button"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="focus:outline-none"
                        aria-label={
                          passwordVisible ? "Hide password" : "Show password"
                        }
                      >
                        {passwordVisible ? (
                          <LuHelpCircle className="text-default-400" />
                        ) : (
                          <LuHelpCircle className="text-default-400" />
                        )}
                      </button>
                    }
                    classNames={{
                      inputWrapper: "border border-default-200",
                    }}
                    autoComplete="new-password"
                  />

                  <Input
                    type={passwordVisible ? "text" : "password"}
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    {...signupForm.register("confirmPassword")}
                    isInvalid={!!signupForm.formState.errors.confirmPassword}
                    errorMessage={
                      signupForm.formState.errors.confirmPassword?.message
                    }
                    startContent={
                      <LuShieldCheck className="text-default-400" />
                    }
                    classNames={{
                      inputWrapper: "border border-default-200",
                    }}
                    autoComplete="new-password"
                  />

                  <Button
                    type="submit"
                    color="warning"
                    size="lg"
                    isDisabled={!signupForm.formState.isValid || loading}
                    isLoading={loading}
                    fullWidth
                    className="font-medium mt-2"
                  >
                    {loading ? (
                      <Spinner size="sm" color="white" />
                    ) : (
                      <>
                        Create Account <LuUserPlus className="ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm pt-2">
                    <span className="text-foreground/70">
                      Already have an account?{" "}
                    </span>
                    <Button
                      variant="light"
                      size="sm"
                      className="text-warning p-0 min-w-fit h-fit"
                      onClick={() => setIsLoginView(true)}
                    >
                      Sign in
                    </Button>
                  </div>

                  <p className="text-xs text-foreground/50 text-center pt-4">
                    By signing up, you agree to our{" "}
                    <Link
                      href="/terms"
                      className="text-warning hover:underline"
                    >
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-warning hover:underline"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              </CardBody>
            </Card>
          </Tab>
        </Tabs>
      </div>
    </div>
  );
}
