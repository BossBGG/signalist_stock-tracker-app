'use client';
import FooterLink from '@/components/form/FooterLink'
import InputField from '@/components/form/InputField'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import React from 'react'
import { useForm } from 'react-hook-form'

const SignIn = () => {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors , isSubmitting},
  } = useForm<SignInFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = async() => {
    try {
      console.log('Sign In')
    } catch (error) {
      console.log(error)
    }
  }

  return (
    <>
    <h1 className="form-title">Welcome back</h1>

    <InputField
    name='email'
    label='Email'
    placeholder='contact@gmail.com'
    register={register}
    error={errors.email}
    validation={{ required : 'Email is required', pattern: /^\w+@\w+\.\w+$/ }}
    />

        <InputField
    name='password'
    label='Password'
    placeholder='Enter your password'
    register={register}
    error={errors.password}
    validation={{ required : 'Password is required', minLength: 8 }}
    />

    <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full mt-5">
      {isSubmitting ? "Signing In" : "Sign In"}
    </Button>

    <FooterLink text="Don't have an account?" linkText='Create an account' href='/sign-up'/>

    </>
  )
}

export default SignIn;