import { act, fireEvent, screen } from '@testing-library/react'
import { Suspense, useState } from 'react'
import useSWR from 'swr'
import { createKey, renderWithConfig, nextTick } from './utils'

describe('useSWR - fetcher', () => {
  // https://github.com/khulnasoft/swr/issues/1131
  it('should use the latest fetcher reference', async () => {
    const key = createKey()
    let fetcher = () => 'foo'
    let mutate
    let rerender

    function Page() {
      const { data, mutate: boundMutate } = useSWR(key, fetcher)
      rerender = useState({})[1]
      mutate = boundMutate

      return <div>data:{data}</div>
    }

    renderWithConfig(<Page />)
    await nextTick()
    screen.getByText('data:foo')

    // Change the fetcher and make sure the ref is updated.
    fetcher = () => 'bar'
    act(() => rerender({}))

    // Revalidate.
    await act(() => mutate())

    // Should fetch with the new fetcher.
    await screen.findByText('data:bar')
  })

  it('should use the latest fetcher reference when the key has been changed', async () => {
    const key = createKey()
    let fetcher = () => 'foo'

    function Page() {
      const [prefix, setPrefix] = useState('a')
      const { data } = useSWR(prefix + key, fetcher)

      return (
        <div>
          <p>data:{data}</p>
          <button
            onClick={() => {
              setPrefix('b')
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    renderWithConfig(<Page />)
    await screen.findByText('data:foo')

    // Change the fetcher and make sure the ref is updated.
    fetcher = () => 'bar'
    fireEvent.click(screen.getByText('mutate'))

    // Should fetch with the new fetcher.
    await screen.findByText('data:bar')
  })

  it('should use the latest fetcher reference with the suspense mode when the key has been changed', async () => {
    const key = createKey()
    let fetcher = () => 'foo'

    function Page() {
      const [prefix, setPrefix] = useState('a')
      const { data } = useSWR(prefix + key, fetcher, { suspense: true })

      return (
        <div>
          <p>data:{data}</p>
          <button
            onClick={() => {
              setPrefix('b')
            }}
          >
            mutate
          </button>
        </div>
      )
    }

    renderWithConfig(
      <Suspense fallback="loading">
        <Page />
      </Suspense>
    )
    await screen.findByText('data:foo')

    // Change the fetcher and make sure the ref is updated.
    fetcher = () => 'bar'
    fireEvent.click(screen.getByText('mutate'))

    // Should fetch with the new fetcher.
    await screen.findByText('data:bar')
  })

  it('should be able to pass falsy values to the fetcher', () => {
    const key = createKey()

    function Page({ fetcher }) {
      const { data } = useSWR(key, fetcher)

      return (
        <div>
          <p>data:{data}</p>
        </div>
      )
    }

    const { rerender } = renderWithConfig(<Page fetcher={null} />)
    screen.getByText('data:')

    rerender(<Page fetcher={undefined} />)
    screen.getByText('data:')

    rerender(<Page fetcher={false} />)
    screen.getByText('data:')
  })
})
