import * as React from "react"
import { Link } from "react-router-dom"
import { connector } from "../../actionCreators/index"
import { lifecycle } from "recompose"
import { arweave } from "../../../index"
import styled from "styled-components"

import {
  Repository,
  setIsAuthenticated,
  loadAddress,
  updateRepositories,
  loadNotifications,
  Notification
} from "../../reducers/argit"
import { txQuery } from "../../../utils"
import { openCreateRepoModal } from "../../reducers/app"

type ConnectedProps = {
  isAuthenticated: boolean
  repositories: Repository[]
  setIsAuthenticated: typeof setIsAuthenticated
  loadAddress: typeof loadAddress
  updateRepositories: typeof updateRepositories
  openCreateRepoModal: typeof openCreateRepoModal
  loadNotifications: typeof loadNotifications
  notifications: typeof Notification[]
}

export const Repositories = connector(
  state => ({
    repositories: state.argit.repositories,
    address: state.argit.address,
    isAuthenticated: state.argit.isAuthenticated,
    notifications: state.argit.notifications
  }),
  actions => ({
    loadAddress: actions.argit.loadAddress,
    updateRepositories: actions.argit.updateRepositories,
    openCreateRepoModal: actions.app.openCreateRepoModal,
    loadNotifications: actions.argit.loadNotifications
  }),
  lifecycle<ConnectedProps, {}>({
    async componentDidMount() {
      // UI Boot
      // await delay(150)

      const { isAuthenticated, repositories, ...actions } = this.props

      if (isAuthenticated) {
        const address = await arweave.wallets.jwkToAddress(
          JSON.parse(String(sessionStorage.getItem("keyfile")))
        )
        actions.loadAddress({ address })

        const txids = await arweave.arql(txQuery(address, "create-repo"))
        let notifications: Notification[] = []
        const repositories = await Promise.all(
          txids.map(async txid => {
            let repository = {} as Repository
            const data: any = await arweave.transactions.getData(txid, {
              decode: true,
              string: true
            })
            try {
              const decoded: any = JSON.parse(data)
              repository = {
                name: decoded.name,
                description: decoded.description
              }
            } catch (error) {
              repository = {
                name: txid,
                description: "Pending confirmation"
              }
              notifications.push({
                type: "pending",
                action: "create-repo",
                txid: txid
              })
            }

            if (!repository) {
              repository = {
                name: txid,
                description: "null"
              }
            }

            return repository
          })
        )
        console.log("not", notifications)
        actions.loadNotifications({ notifications })
        actions.updateRepositories({ repositories })
      }
    }
  })
)(function RepositoriesImpl(props) {
  const Button = styled.i`
    cursor: pointer;
  `

  return (
    <React.Fragment>
      <h1>
        Repositories{" "}
        <Button
          onClick={() => props.openCreateRepoModal({})}
          className="fa fa-plus-circle"
          aria-hidden="true"
        />
      </h1>

      {props.repositories &&
        props.repositories.map(
          repository =>
            repository.name && (
              <div key={repository.name} className="card mt-4">
                <div className="card-body">
                  <Link
                    to={`/app/main/repository/${props.address}/${
                      repository.name
                    }`}
                  >
                    {repository.name}
                  </Link>
                  <p>{repository.description}</p>
                </div>
              </div>
            )
        )}
    </React.Fragment>
  )
})