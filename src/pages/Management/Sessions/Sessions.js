import React, { Component } from 'react'

import { Table, Space, Button, Divider, Modal, Form, Input, InputNumber, Slider, Radio, List } from 'antd'
import Column from 'antd/lib/table/Column'
import { CheckCircleTwoTone, CloseCircleTwoTone, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

import AntBreacrumb from '../../../components/Management/Breadcrumb/AntBreadcrumb'

import { API } from '../../../services/api'
import { Fragment } from 'react';

class Sessions extends Component {
  state = {
    sessionData: [],
    loading: false,
    isFormOpen: false,
    formLoading: false,
    isEditing: false,
    editingSessionId: '',
    editingSessionData: [],
    isDetailOpen: false,
    viewSessionId: '',
    viewSessionData: []
  }

  componentDidMount() {
    this.fetchData(this.props.match.params.classId)
  }

  fetchData = async (classId) => {
    this.setState({ loading: true })
    const result = await API.get(`/search-session-class/${classId}`)
    this.setState({ sessionData: result.data, loading: false })
  }

  toggleForm = async (sessionId = null, isEditing = false) => {
    if (isEditing) {
      if (sessionId !== this.state.editingSessionId) {
        this.setState({ formLoading: true })
        const result = await API.get(`/session-with-questions/${sessionId}`)
        this.setState({
          isEditing: true,
          editingSessionId: sessionId,
          editingSessionData: result.data,
          formLoading: false,
          isFormOpen: !this.state.isFormOpen
        })
      } else {
        this.setState({
          isEditing: true,
          formLoading: false,
          isFormOpen: !this.state.isFormOpen
        })
      }
    } else {
      this.setState({
        isFormOpen: !this.state.isFormOpen,
        isEditing: false
      })
    }
  }

  toggleDetail = async (sessionId = null) => {
    if (sessionId !== this.state.viewSessionId) {
      const result = await API.get(`/list-question/${sessionId}`)
      this.setState({
        viewSessionId: sessionId,
        viewSessionData: result.data,
        isDetailOpen: !this.state.isDetailOpen,
        isFormOpen: false
      })
    } else {
      this.setState({
        isDetailOpen: !this.state.isDetailOpen,
        isFormOpen: false
      })
    }
  }

  onFinish = (values) => {
    const useQuiz = typeof values.questions === 'undefined' || values.questions.length === 0 ? false : true
    const newValues = { ...values, useQuiz, classId: this.props.match.params.classId }
    console.log(newValues)
    if (this.state.isEditing) {
      API.put(`/edit-session-question/${values.id}`, { ...newValues })
        .then(result => {
          this.toggleForm()
          this.fetchData(this.props.match.params.classId)
        })
        .catch(err => this.onFinishFailed(err))
    } else {
      API.post('/create-session-question', { ...newValues })
        .then(result => {
          console.log(result)
          this.toggleForm()
          this.fetchData(this.props.match.params.classId)
        })
        .catch(err => this.onFinishFailed(err))
    }
  };

  onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo)
  };

  render() {
    const { sessionData, loading, isFormOpen, isEditing, editingSessionData, isDetailOpen, viewSessionData, viewSessionId } = this.state
    const breadcrumb = (
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <AntBreacrumb
          elements={[
            { key: 1, text: 'Admin', to: '/admin' },
            { key: 2, text: 'Classes', to: '/admin/classes' },
            { key: 3, text: `${this.props.match.params.classId} Sessions` }
          ]}
        />
        <Button type='primary' onClick={this.toggleForm} style={{ margin: '1rem 0' }}>Create New Session</Button>
      </div>
    )

    const table = (
      <Table dataSource={sessionData} loading={loading} pagination={true} rowKey='id'>
        <Column title='Session Id' dataIndex='id' key='id' />
        <Column title='Week Number' dataIndex='weekNo' key='weekNo'
          defaultSortOrder='ascend'
          sorter={(a, b) => a.weekNo - b.weekNo}
        />
        <Column title='Quiz' dataIndex='useQuiz' key='useQuiz'
          render={useQuiz => useQuiz ?
            <CheckCircleTwoTone twoToneColor="#52c41a" />
            : <CloseCircleTwoTone twoToneColor="#FF0000" />}
        />
        <Column title='Status' render={() => "Incompleted"} />
        <Column title="Action" key="action"
          render={(text, record) => (
            <Space size="middle">
              {/* <Button type='link' onClick={() => this.toggleForm(record.id, true)}>Edit Session</Button> */}
              <Button type='link' onClick={() => this.toggleDetail(record.id)}>View Question</Button>
              <a href='/delete'>Delete</a>
            </Space>
          )}
        />
      </Table>
    )

    const questionList = (
      <Modal style={{ top: '5' }} width={'90%'} visible={isDetailOpen} onOk={this.toggleDetail} onCancel={this.toggleDetail}>
        <Divider orientation="left">{viewSessionId} questions</Divider>
        <List
          grid={{ gutter: 16, column: 4 }}
          dataSource={viewSessionData}
          renderItem={data => (
            <List.Item>
              <h6>{data.question}</h6>
              <List
                dataSource={data.answers}
                renderItem={answer => (
                  <List.Item>
                    <p>{answer.answerText}</p>
                    { answer.isCorrect && <CheckCircleTwoTone twoToneColor="#52c41a" />}
                  </List.Item>
                )}
              />
            </List.Item>
          )}
        />
      </Modal>
    )

    const form = (
      <Modal title={isEditing ? 'Update Session' : 'Create New Session'} visible={isFormOpen} onCancel={() => this.toggleForm()}
        footer={[
          <Button onClick={() => this.toggleForm()} key='cancel'>
            Cancel
          </Button>,
          <Button form="sessionForm" type='primary' key="submit" htmlType="submit">
            Submit
          </Button>
        ]}
      >
        <Form
          initialValues={isEditing && editingSessionData}
          id='sessionForm' layout='vertical'
          onFinish={this.onFinish}
          onFinishFailed={this.onFinishFailed}
        >
          <Form.Item hidden name='id'>
            <Input />
          </Form.Item>
          <Form.Item label="Week Number" name='weekNo'>
            <InputNumber />
          </Form.Item>
          <Form.Item label="Entry Timer" name='entryTimer'>
            <Slider
              marks={{
                0: '0',
                20: '20',
                40: '40',
                60: '60',
                80: '80',
                100: '100'
              }}
            />
          </Form.Item>
          <Form.List name='questions'>
            {(fields, { add, remove }) => (
              <Fragment>
                {fields.map(field => (
                  <Fragment>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
                      <Form.Item
                        {...field}
                        name={[field.name, 'question']}
                        fieldKey={[field.fieldKey, 'question']}
                        rules={[{ required: true, message: 'Missing question' }]}
                        style={{ width: '90%' }}
                      >
                        <Input placeholder="Question" />
                      </Form.Item>
                      <MinusCircleOutlined onClick={() => remove(field.name)} />
                    </div>
                    <Form.List {...field} name={[field.name, 'answers']}>
                      {(ansFields, { add, remove }) => (
                        <Fragment>
                          {ansFields.map(ansField => (
                            <Space key={ansField.key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                              <Form.Item
                                {...ansField}
                                name={[ansField.name, 'answerText']}
                                fieldKey={[ansField.fieldKey, 'answerText']}
                                rules={[{ required: true, message: 'Missing text' }]}
                              >
                                <Input placeholder="Answer" />
                              </Form.Item>
                              <Form.Item
                                {...ansField}
                                name={[ansField.name, 'isCorrect']}
                                fieldKey={[ansField.fieldKey, 'isCorrect']}
                              >
                                <Radio.Group>
                                  <Radio value={true}>True</Radio>
                                  <Radio value={false}>False</Radio>
                                </Radio.Group>
                              </Form.Item>
                              <MinusCircleOutlined onClick={() => remove(ansField.name)} />
                            </Space>
                          ))}
                          {ansFields.length < 4 && <Form.Item>
                            <Button style={{ width: '80%' }} type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                              Add answer
                          </Button>
                          </Form.Item>}
                          <Divider />
                        </Fragment>
                      )}
                    </Form.List>
                  </Fragment>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add question
                  </Button>
                </Form.Item>
              </Fragment>
            )}
          </Form.List>
        </Form>
      </Modal>
    )

    return (
      <div>
        {breadcrumb}
        {table}
        {form}
        {questionList}
      </div>
    )
  }
}

export default Sessions
