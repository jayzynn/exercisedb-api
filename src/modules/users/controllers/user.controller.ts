import { Routes } from '#common/types/route.type.js'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'
import { UserService } from '../services'
import User from '#infra/mongodb/models/users/user.schema.js'
import { IUserDoc } from '#infra/mongodb/models/users/user.entity'
export class UserController implements Routes {
  public controller: OpenAPIHono
  private readonly userService: UserService
  constructor() {
    this.controller = new OpenAPIHono()
    this.userService = new UserService(User)
  }

  public initRoutes() {
    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/register',
        tags: ['Users'],
        summary: 'register users endpoint ',
        description: 'This route is used to register user account.',
        operationId: 'registerUser',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  email: z.string().email().openapi({
                    title: 'Email',
                    description: 'Email for account register',
                    type: 'string',
                    example: 'johndoe@example.com'
                  })
                })
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User register successfully.',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z
                    .object({
                      id: z.string().openapi({
                        title: 'user Id',
                        description: 'user unique identifier'
                      }),
                      email: z.string().openapi({
                        title: 'user email',
                        description: 'user email address'
                      }),
                      role: z.string().openapi({
                        title: 'user role',
                        description: 'user active role'
                      }),
                      isActivated: z.string().openapi({
                        title: 'activation status',
                        description: 'user account activation status'
                      }),
                      otpSecret: z.string().openapi({
                        title: 'Otp Secret',
                        description: 'otp secret for adding in authenticator app'
                      })
                    })
                    .openapi({
                      title: 'User Data',
                      description: 'The newly registered user'
                    })
                })
              }
            }
          },
          400: {
            description: 'Bad request - Invalid input data',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
                })
              }
            }
          },
          409: {
            description: 'Conflict - email already exists'
          },
          500: {
            description: 'Internal server error'
          }
        }
      }),
      async (ctx) => {
        try {
          const email = (await ctx.req.json()).email

          const response = await this.userService.createUser({ email })
          return ctx.json({ success: true, data: response }, 201)
        } catch (error) {
          console.error('Error in creating user:', error)
          if (error instanceof HTTPException) {
            return ctx.json({ success: false, error: error.message }, error.status)
          }
          return ctx.json({ success: false, error: 'Internal Server Error' }, 500)
        }
      }
    )

    this.controller.openapi(
      createRoute({
        method: 'post',
        path: '/authenticate',
        tags: ['Users'],
        summary: 'User Authentication',
        description: 'This route is used to authenticate user based on email and authenticator code.',
        operationId: 'authenticateUser',
        request: {
          body: {
            content: {
              'application/json': {
                schema: z.object({
                  email: z.string().email().openapi({
                    title: 'Email',
                    description: 'user registered email address',
                    type: 'string',
                    example: 'johndoe@example.com'
                  }),
                  code: z.string().openapi({
                    title: 'Authenticator code',
                    description: 'code generated by Authenticator app ',
                    type: 'string',
                    example: '6XX5XX'
                  })
                })
              }
            }
          }
        },
        responses: {
          200: {
            description: 'User authenticated successfully.',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean().openapi({
                    description: 'Indicates whether the authentication request was successful',
                    type: 'boolean',
                    example: true
                  }),
                  data: z
                    .object({
                      accessToken: z.string().openapi({
                        title: 'Access token',
                        description: 'access token for making post requests'
                      })
                    })
                    .openapi({
                      title: 'Access Token',
                      description: 'new access token'
                    })
                })
              }
            }
          },
          400: {
            description: 'Bad request - Invalid input data',
            content: {
              'application/json': {
                schema: z.object({
                  success: z.boolean(),
                  error: z.string()
                })
              }
            }
          },
          500: {
            description: 'Internal server error'
          }
        }
      }),
      async (ctx) => {
        try {
          const email = (await ctx.req.json()).email
          const code = (await ctx.req.json()).code

          const response = await this.userService.authenticate({ email, code })
          return ctx.json({ success: true, data: response }, 200)
        } catch (error) {
          console.error('Error in authenticating user:', error)
          if (error instanceof HTTPException) {
            return ctx.json({ success: false, error: error.message }, error.status)
          }
          return ctx.json({ success: false, error: 'Internal Server Error' }, 500)
        }
      }
    )
  }
}
