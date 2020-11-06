import { relative, dirname, resolve } from 'path'
import { writeFile, mkdirp } from 'fs-extra'
import jiti from 'jiti'
import defu from 'defu'
import Hookable from 'hookable'
import type { NuxtOptions } from '@nuxt/types'
import { SLSOptions, UnresolvedPath, SLSTarget } from './config'

export function hl (str: string) {
  return '`' + str + '`'
}

export function prettyPath (p: string, highlight = true) {
  p = relative(process.cwd(), p)
  return highlight ? hl(p) : p
}

export function compileTemplate (contents: string) {
  return (params: Record<string, any>) => contents.replace(/{{ ?(\w+) ?}}/g, (_, match) => params[match] || '')
}

export function serializeTemplate (contents: string) {
  // eslint-disable-next-line no-template-curly-in-string
  return `export default (params) => \`${contents.replace(/{{ (\w+) }}/g, '${params.$1}')}\``
}

export async function writeFileP (path, contents) {
  await mkdirp(dirname(path))
  await writeFile(path, contents)
}

export function jitiImport (dir: string, path: string) {
  return jiti(dir)(path)
}

export function tryImport (dir: string, path: string) {
  try {
    return jitiImport(dir, path)
  } catch (_err) { }
}

export function resolvePath (options: SLSOptions, path: UnresolvedPath, resolveBase: string = '') {
  if (typeof path === 'function') {
    path = path(options)
  }

  path = compileTemplate(path)(options)

  return resolve(resolveBase, path)
}

export function detectTarget () {
  if (process.env.NETLIFY) {
    return 'netlify'
  }

  if (process.env.VERCEL_URL) {
    return 'vercel'
  }

  return 'node'
}

export function extendTarget (base: SLSTarget, target: SLSTarget): SLSTarget {
  return (nuxtOptions: NuxtOptions) => {
    if (typeof target === 'function') {
      target = target(nuxtOptions)
    }

    if (typeof base === 'function') {
      base = base(base)
    }

    return defu({
      hooks: Hookable.mergeHooks(base.hooks, target.hooks),
      nuxtHooks: Hookable.mergeHooks(base.nuxtHooks as any, target.nuxtHooks as any)
    }, target, base)
  }
}
