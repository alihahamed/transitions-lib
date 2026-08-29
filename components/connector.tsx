import { ViewTransition } from 'react'
import './transitions.css'

/**
 * The connector: give the same `id` to an element on two routes and the browser
 * morphs one into the other across the navigation.
 *
 *   // /gallery
 *   <Connector id={`card-${p.id}`}><Card /></Connector>
 *   // /gallery/[id]
 *   <Connector id={`card-${p.id}`}><Hero /></Connector>
 *
 * Ids must be unique per page — two live elements sharing one id cancels the morph.
 * Takes exactly one child element.
 */
export function Connector({
  id,
  children,
}: {
  id: string
  children: React.ReactNode
}) {
  return (
    <ViewTransition name={id} share="t-connector" default="none">
      {children}
    </ViewTransition>
  )
}
