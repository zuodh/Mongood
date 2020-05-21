/* eslint-disable react/jsx-props-no-spreading */

import React, { useState } from 'react'
import {
  ShimmeredDetailsList,
  SelectionMode,
  DetailsListLayoutMode,
  ConstrainMode,
  Sticky,
  ScrollablePane,
  DetailsHeader,
  IDetailsHeaderProps,
  ProgressIndicator,
  ContextualMenu,
} from '@fluentui/react'
import useSWR from 'swr'
import { useSelector } from 'react-redux'
import _ from 'lodash'

import { runCommand } from '@/utils/fetcher'
import { stringify } from '@/utils/mongo-shell-data'

export function Table() {
  const { database, collection } = useSelector((state) => state.root)
  const { index, filter, sort, skip, limit } = useSelector(
    (state) => state.documents,
  )
  const [event, setEvent] = useState<MouseEvent>()
  const [item, setItem] = useState<any>()
  const { data, isValidating } = useSWR(
    database && collection
      ? `find/${database}/${collection}/${skip}/${limit}/${JSON.stringify(
          filter,
        )}/${JSON.stringify(sort)}`
      : null,
    () => {
      return runCommand<{ cursor: { firstBatch: unknown[] } }>(
        database,
        {
          find: collection,
          filter,
          sort,
          hint: _.isEmpty(filter) ? undefined : index?.name,
          skip,
          limit,
        },
        { canonical: true },
      )
    },
    {
      refreshInterval: 10 * 1000,
      errorRetryCount: 0,
    },
  )

  return (
    <div style={{ position: 'relative', height: 0, flex: 1 }}>
      <ContextualMenu
        items={[
          {
            key: 'copy',
            text: 'Copy Document',
            onClick: () => {
              window.navigator.clipboard.writeText(
                `{${_.map(
                  item,
                  (value, key) => `${key}: ${stringify(value)}`,
                ).join(', ')}}`,
              )
            },
          },
        ]}
        hidden={!event}
        target={event}
        onItemClick={() => {
          setEvent(undefined)
        }}
        onDismiss={() => {
          setEvent(undefined)
        }}
      />
      <ScrollablePane
        styles={{
          root: { maxWidth: '100%' },
          stickyBelow: { display: 'none' },
        }}>
        <ShimmeredDetailsList
          compact={true}
          enableShimmer={!data}
          selectionMode={SelectionMode.none}
          constrainMode={ConstrainMode.unconstrained}
          layoutMode={DetailsListLayoutMode.fixedColumns}
          items={data?.cursor.firstBatch || []}
          onRenderItemColumn={(_item, _index, colume) =>
            stringify(_item[colume?.key!])
          }
          onRenderDetailsHeader={(detailsHeaderProps) => (
            <Sticky>
              <DetailsHeader
                {...(detailsHeaderProps as IDetailsHeaderProps)}
                styles={{ root: { paddingTop: 0 } }}
              />
              {isValidating ? (
                <ProgressIndicator
                  styles={{ root: { marginTop: -9, marginBottom: -9 } }}
                />
              ) : null}
            </Sticky>
          )}
          onItemContextMenu={(_item, _index, ev) => {
            setEvent(ev as MouseEvent)
            setItem(_item)
          }}
        />
      </ScrollablePane>
    </div>
  )
}