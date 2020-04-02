/** @jsx jsx */
import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { Styled, jsx } from 'theme-ui'
import { Grid, Box } from '@theme-ui/components'
import { useQuery } from '@apollo/react-hooks'
import queryString from 'query-string'
import { navigate } from '@reach/router'

import { PROJECTS_QUERY, EVEREST_QUERY } from '../utils/apollo/queries'
import { FILTERS, ORDER_BY, ORDER_DIRECTION } from '../utils/constants'

import Section from '../components/Section'
import Switcher from '../components/Switcher'
import Filters from '../components/Filters'
import Sorting from '../components/Sorting'
import Button from '../components/Button'

const Projects = ({ location }) => {
  const queryParams = queryString.parse(location.search)

  const [allProjects, setAllProjects] = useState([])
  const [projectCount, setProjectCount] = useState(0)
  const [challengesCount, setChallengesCount] = useState(null)
  const [selected, setSelected] = useState('cards')
  const [selectedFilter, setSelectedFilter] = useState(
    queryParams && queryParams.view ? queryParams.view : FILTERS.all,
  )
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedOrderBy, setSelectedOrderBy] = useState(ORDER_BY['Name'])
  const [selectedOrderDirection, setSelectedOrderDirection] = useState(
    ORDER_DIRECTION.ASC,
  )
  const [isSortingOpen, setIsSortingOpen] = useState(false)

  const variables = {
    orderDirection: selectedOrderDirection,
    orderBy: selectedOrderBy,
    first: 30,
    skip: 0,
  }

  const { data: everestData } = useQuery(EVEREST_QUERY)

  const { error, data, loading, fetchMore } = useQuery(PROJECTS_QUERY, {
    variables:
      selectedFilter === FILTERS.all
        ? variables
        : {
            ...variables,
            where: {
              currentChallenge_not: null,
            },
          },
    notifyOnNetworkStatusChange: true,
  })

  if (error) {
    console.error('Error with GraphQL query: ', error)
    return <div />
  }

  useEffect(() => {
    setAllProjects(data ? data.projects : [])
    setProjectCount(
      everestData && everestData.everests
        ? everestData.everests[0].projectCount
        : 0,
    )
    setChallengesCount(
      everestData && everestData.everests
        ? everestData.everests[0].challengedProjects
        : 0,
    )
  }, [data, everestData])

  return (
    <Grid>
      <Grid columns={[1, 2, 2]}>
        <Box>
          <Grid
            sx={{
              gridTemplateColumns: 'min-content 1fr ',
              alignItems: 'center',
            }}
            gap={4}
          >
            <Styled.h2
              sx={{
                borderRight: challengesCount !== 0 ? '1px solid' : 'none',
                borderColor: 'grey',
                pr: 5,
                mb: 2,
              }}
            >
              Projects
            </Styled.h2>
            {challengesCount !== 0 && (
              <Filters
                items={[
                  {
                    text: 'All projects',
                    handleSelect: () => {
                      setSelectedFilter(FILTERS.all)
                      navigate(`?view=${FILTERS.all}`)
                    },
                  },
                  {
                    text: 'Challenged projects',
                    handleSelect: () => {
                      setSelectedFilter(FILTERS.challenged)
                      navigate(`?view=${FILTERS.challenged}`)
                    },
                  },
                ]}
                menuStyles={{ left: 0, width: '280px', top: '60px' }}
                setIsFilterOpen={setIsFilterOpen}
                isFilterOpen={isFilterOpen}
                selectedFilter={selectedFilter}
              />
            )}
          </Grid>
          <Styled.p sx={{ opacity: 0.64, color: 'rgba(9,6,16,0.5)' }}>
            {projectCount} Projects -{' '}
            {allProjects.filter(p => p.currentChallenge !== null).length && (
              <span>{challengesCount} Challenges</span>
            )}
          </Styled.p>
        </Box>
        <Grid
          sx={{
            gridTemplateColumns: '1fr max-content',
            alignItems: 'baseline',
          }}
        >
          <Sorting
            selectedOrderBy={selectedOrderBy}
            setSelectedOrderBy={setSelectedOrderBy}
            selectedOrderDirection={selectedOrderDirection}
            setSelectedOrderDirection={setSelectedOrderDirection}
            isSortingOpen={isSortingOpen}
            setIsSortingOpen={setIsSortingOpen}
            orderBy={ORDER_BY}
          />
          <Switcher
            selected={selected}
            setSelected={setSelected}
            sx={{
              borderLeft: '1px solid',
              borderColor: 'grey',
              pl: 4,
            }}
          />
        </Grid>
      </Grid>
      <Box sx={{ position: 'relative' }}>
        <Section
          items={
            allProjects &&
            allProjects.map(project => {
              return {
                ...project,
                description: project.description
                  ? project.description.length > 30
                    ? project.description.slice(0, 26) + '...'
                    : project.description
                  : '',
                to: `/project/${project.id}`,
                image: project.avatar,
                isChallenged: project.currentChallenge !== null,
                category:
                  project.categories.length > 0
                    ? project.categories[0].name
                    : '',
              }
            })
          }
          variant="project"
          selected={selected}
        />
        {loading && (
          <img
            src="/loading-dots-blue.gif"
            sx={{ position: 'absolute', left: 0, right: 0, margin: '0 auto' }}
          />
        )}
        {data &&
          data.projects &&
          !loading &&
          (selectedFilter === FILTERS.all
            ? data.projects.length < projectCount
            : data.projects.length < challengesCount) && (
            <Button
              variant="secondary"
              text="Load more"
              sx={{
                margin: '0 auto',
                mt: 6,
                border: '1px solid',
                borderColor: 'secondary',
              }}
              onClick={() => {
                fetchMore({
                  variables:
                    selectedFilter === FILTERS.all
                      ? { ...variables, skip: data.projects.length }
                      : {
                          ...variables,
                          skip: data.projects.length,
                          where: {
                            currentChallenge_not: null,
                          },
                        },
                  updateQuery: (prev, { fetchMoreResult }) => {
                    if (!fetchMoreResult) return prev
                    return Object.assign({}, prev, {
                      projects: [...prev.projects, ...fetchMoreResult.projects],
                    })
                  },
                })
              }}
            />
          )}
      </Box>
    </Grid>
  )
}

Projects.propTypes = {
  location: PropTypes.any,
}

export default Projects
