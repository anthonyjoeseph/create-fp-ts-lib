import * as RTE from '../ReaderTaskEither'
import { pipe } from 'fp-ts/lib/function'
import { Extends, tag } from '../type-utils'
import { FileObj, FileObj_ } from '../FileObj'
import { modify } from '@no-day/ts-prefix'
import * as R from 'fp-ts/Record'
import { Capabilities } from '../Capabilities'
import { Config } from '../Config/type'
import { sequenceS } from 'fp-ts/lib/Apply'
import { ReaderTaskEither } from 'fp-ts/lib/ReaderTaskEither'
import { prettierConfig } from '../prettier-config'
import { Json } from '../Json'

// -----------------------------------------------------------------------------
// types
// -----------------------------------------------------------------------------

type Env = {
  cap: Capabilities
  config: Config
  files: InFiles
}

type Effect<A> = ReaderTaskEither<Env, string, A>

type InFiles = Extends<
  Record<string, FileObj>,
  {
    'package.json': FileObj_['PackageJson']
  }
>

type OutFiles = Extends<
  Record<string, FileObj>,
  {
    'package.json': FileObj_['PackageJson']
    '.prettierrc': FileObj_['Json']
  }
>

// -----------------------------------------------------------------------------
// Effect
// -----------------------------------------------------------------------------

const packageJson: Effect<FileObj_['PackageJson']> = RTE.scope(({ files }) =>
  pipe(
    files['package.json'],
    modify('data', (data) =>
      pipe(
        data,
        modify('dependencies', R.upsertAt('prettier', '^2.2.1')),
        modify('scripts', R.upsertAt('pretty', 'yarn prettier --check .'))
      )
    ),
    RTE.of
  )
)

const prettierRc: Effect<FileObj_['Json']> = pipe(
  prettierConfig as Json,
  tag('Json'),
  RTE.of
)

const prettierIgnore: Effect<FileObj_['Text']> = pipe(
  ['/dist'],
  tag('Text'),
  RTE.of
)

const main: Effect<OutFiles> = RTE.scope(() =>
  pipe(
    {
      'package.json': packageJson,
      '.prettierrc': prettierRc,
      '.prettierignore': prettierIgnore,
    },
    sequenceS(RTE.ApplySeq)
  )
)

// -----------------------------------------------------------------------------
// export
// -----------------------------------------------------------------------------

export default main
