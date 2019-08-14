import React, {Component} from 'react'
import {Table, Input, Card, CardHeader, CardBody, Button, Nav, NavItem, NavLink} from 'reactstrap'
import API from './API'
import Formatters from './Formatters'
import Pagination from './Pagination'

const config = {
  columns: [
    {heading: 'First Name', formatter: null, width: '150px', filterBox: true, key: 'firstName'},
    {heading: 'Last Name', formatter: null, width: '150px', filterBox: true, key: 'lastName'},
    {heading: 'Phone', formatter: () => Formatters.phoneLinkFormatter, width: '180px', filterBox: true, key: 'phone'},
    {heading: 'Email', formatter: () => Formatters.emailLinkFormatter, width: '200px', filterBox: true, key: 'email'},
    {heading: 'City', formatter: null, width: '120px', filterBox: true, key: 'city'},
    {heading: 'Created', formatter: () => Formatters.dateFormatter, width: '100px', filterBox: false, key: 'created'},
    {heading: 'Updated', formatter: () => Formatters.dateFormatter, width: '100px', filterBox: false, key: 'updated'},
  ],
}

const emptyQueryState = {
  filter: {},
  searchText: '',
  tab: '',
  page: '',
  type: 'customer',
}

class PageCustomers extends Component {

  constructor(props){

    super(props)

    this.state = {
      queryState: JSON.parse(JSON.stringify(emptyQueryState)),
    }

  }

  refreshData = (state) => {

    let query = API.buildCustomerQueryFromState(state)

    API.searchCustomers(query)
    .then(res => {

      this.setState({
        data: res.data,
        count: res.count,
        size: res.size,
        limit: res.limit,
        skip: res.skip,
      })

    })

  }

  // EVENT HANDLERS
  // //////////////////////////////////////////////////////////////////////////////////////////////

  handleTabChange = (event) => {

    let label = event.target.name

    let queryState = Object.assign({}, this.state.queryState)

    queryState.tab = label

    this.setState({queryState})

    this.refreshData(queryState)

  }

  handleFilterChange = (event) => {

    let key = event.target.name

    let value = event.target.value

    let queryState = Object.assign({}, this.state.queryState)

    queryState.filter[key] = value

    this.setState({queryState})

    this.refreshData(queryState)

  }

  handleSearchChange = (event) => {

    let value = event.target.value

    let queryState = Object.assign({}, this.state.queryState)

    queryState.searchText = value

    this.setState({queryState})

    this.refreshData(queryState)

  }

  handleClickClearSearch = () => {

    // clear all search filters and search text
    
    this.setState({
      queryState: JSON.parse(JSON.stringify(emptyQueryState))
    })

    this.refreshData(JSON.parse(JSON.stringify(emptyQueryState)))

  }

  handleClickDeleteCustomer = (event) => {

    let _id = event.target.name

    event.stopPropagation()

    if (window.confirm("Are you sure you want to delete this record? This cannot be undone.")){

      API.deleteCustomer(_id)
      .then(res => {

        this.refreshData(this.state.queryState)

      })
      
    }

  }

  handleRowClick = (event, _id) => {

    this.props.history.push('customers/' + _id)

  }

  handleChangeEvent = (event) => {

    let key = event.target.name
    
    let value = event.target.value

    this.setState({[key]: value})

  }

  handleClickNotAuthorized = (event) => {
    
    event.stopPropagation()

    alert("Not authorized.")

  }

  handleClickPagination = (obj) => {

    let queryState = Object.assign({}, this.state.queryState)

    queryState.skip = obj.skip

    this.setState({skip: obj.skip})

    this.refreshData(queryState)

  }

  // LIFE CYCLE EVENTS
  // //////////////////////////////////////////////////////////////////////////////////////////////

  componentDidMount(){

    this.refreshData(this.state.queryState)

  }

  // RENDER VIEWS
  // //////////////////////////////////////////////////////////////////////////////////////////////

  render() {

    let data = this.state.data

    if (!data) return (<div>Loading...</div>)

    let activeTab = this.state.queryState.tab || 'active'

    let columns = config.columns

    let searchText = this.state.queryState.searchText
    
    let filter = this.state.queryState.filter

    let paginationProps = {
      totalItems: this.state.count,
      pageSize: this.state.limit,
      currentPage: this.state.skip/this.state.limit + 1,
      onClick: this.handleClickPagination,
    }

    let managesCustomers = this.props.session && this.props.session.authorizations && this.props.session.authorizations.includes('manages customers')

    return (
      <div className="animated fadeIn">
        <Card>
          <CardHeader>
            <i className="icon-menu"></i> Customers
          </CardHeader>
          <CardBody>
            <Nav tabs onClick={this.handleTabChange}>
              <NavItem >
                <NavLink name="active" active={activeTab === 'active'}>Active</NavLink>
              </NavItem>
              <NavItem>
                <NavLink name="inactive" active={activeTab === 'inactive'}>Inactive</NavLink>
              </NavItem>
              <NavItem>
                <NavLink name="all" active={activeTab === 'all'}>All</NavLink>
              </NavItem>
            </Nav>
            <Table className="table table-hover table-striped table-bordered table-sm">
              <thead>
                <tr>
                  <td colSpan="8">
                    <Pagination {...paginationProps} />
                    <Button size="sm" color="info" className="pull-right" onClick={this.handleClickClearSearch}>Clear</Button>
                    <div className="pull-right w-25"><Input type="text" name="searchText" bsSize="sm" placeholder="Search" className="pull-right" onChange={this.handleSearchChange} value={searchText || ''} /></div>
                  </td>
                </tr>
                <tr className="text-capitalize font-weight-bold">
                  {columns.map(col => (
                    <td width={col.width} key={col.key}>
                      <span>{col.heading}</span>
                      {col.filterBox && (
                        // <TextInput key={col.key} name={col.key} placeholder={col.heading} bsSize="sm" onChange={this.handleFilterChange} value={filter[col.key]} />
                        <Input type="text" name={col.key} placeholder={col.heading} bsSize="sm" onChange={this.handleFilterChange} value={filter[col.key] || ''} />
                      )}
                    </td>
                  ))}
                  <td width="40px" className="text-center"></td>
                </tr>
              </thead>
              <tbody>
                {data.map(item => (
                  <tr className="text-capitalize pointer" onClick={event => this.handleRowClick(event, item._id)} key={item._id}>
                    {columns.map(col => (
                      <td key={col.key}>
                        {col.formatter && col.formatter()(item[col.key])}
                        {!col.formatter && item[col.key]}
                      </td>
                    ))}
                    <td className="text-center" width="60px">
                      {managesCustomers && (
                        <Button color='danger' size="sm" name={item._id} onClick={this.handleClickDeleteCustomer}><i className="fa fa-trash"></i></Button>
                      )}
                    </td>
                  </tr>
                ))}        
              </tbody> 
              <tfoot>
                <tr>
                  <td colSpan="8">
                    <Pagination {...paginationProps} />
                  </td>
                </tr>
              </tfoot>
            </Table>
          </CardBody>
        </Card>
      </div>
    );

  }
}

export default PageCustomers
