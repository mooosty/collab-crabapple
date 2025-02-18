'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, Table, Tag, message, Space, Tabs, Typography } from 'antd';
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface TaskProgress {
  taskId: string;
  projectId: string;
  projectName: string;
  userId: string;
  userEmail: string;
  title: string;
  description: string;
  type: string;
  status: string;
  points: number;
  dueDate: string;
  submission?: string;
  completedAt?: Date;
  subtasks?: {
    subtaskId: string;
    title: string;
    completed: boolean;
    required: boolean;
  }[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectTitle: string;
  deadline: string;
  priority: string;
  status: string;
  points: number;
}

const TasksPage = () => {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskProgress, setTaskProgress] = useState<TaskProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('1');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, progressResponse] = await Promise.all([
        fetch('/api/tasks', {
          headers: {
            'Authorization': `Bearer admin@darknightlabs.com`
          }
        }),
        fetch('/api/admin/task-progress', {
          headers: {
            'Authorization': `Bearer admin@darknightlabs.com`
          }
        })
      ]);

      if (!tasksResponse.ok || !progressResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const tasksData = await tasksResponse.json();
      const progressData = await progressResponse.json();

      setTasks(tasksData.data || []);
      setTaskProgress(progressData.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      message.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
  };

  const handleApproveReject = async (taskId: string, projectId: string, userId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/task-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer admin@darknightlabs.com`
        },
        body: JSON.stringify({
          taskId,
          projectId,
          userId,
          action
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update task status');
      }

      message.success(`Task ${action}d successfully`);
      fetchData(); // Refresh data
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Failed to update task status');
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredProgress = taskProgress.filter(progress => {
    const matchesSearch = 
      progress.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      progress.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show completed and pending_approval tasks
    const isRelevantStatus = progress.status === 'completed' || progress.status === 'pending_approval';
    
    // If status filter is applied, also check against that
    const matchesStatus = statusFilter === 'all' ? isRelevantStatus : (progress.status === statusFilter && isRelevantStatus);
    
    return matchesSearch && matchesStatus;
  });

  // Update status filter options
  const statusOptions = [
    { value: 'all', label: 'All' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending_approval', label: 'Pending Approval' }
  ];

  const taskColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <span className="font-medium text-[#f5efdb]">{text}</span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text: string) => (
        <span className="text-[#f5efdb99]">{text}</span>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'projectTitle',
      key: 'projectTitle',
      render: (text: string) => (
        <Tag className="text-sm bg-[#1a1a18] border-[#f5efdb1a] text-[#f5efdb]">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === 'completed' ? 'success' :
            status === 'in_progress' ? 'processing' :
            status === 'pending' ? 'warning' : 'default'
          }
          className="px-3 py-1"
        >
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => (
        <Tag color="gold" className="text-sm">
          {points} pts
        </Tag>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'deadline',
      key: 'deadline',
      render: (date: string) => (
        <span className="text-gray-600">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
    }
  ];

  const progressColumns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string) => (
        <span className="font-medium text-gray-800">{text}</span>
      ),
    },
    {
      title: 'User',
      dataIndex: 'userEmail',
      key: 'userEmail',
      render: (email: string) => (
        <Tag color="purple" className="text-sm">
          {email}
        </Tag>
      ),
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      render: (text: string) => (
        <Tag color="blue" className="text-sm">
          {text}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag
          color={
            status === 'completed' ? 'success' :
            status === 'in_progress' ? 'processing' :
            status === 'pending' ? 'warning' : 'default'
          }
          className="px-3 py-1"
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Points',
      dataIndex: 'points',
      key: 'points',
      render: (points: number) => (
        <Tag color="gold" className="text-sm">
          {points} pts
        </Tag>
      ),
    },
    {
      title: 'Submission',
      dataIndex: 'submission',
      key: 'submission',
      render: (text: string) => text ? (
        <Button
          type="link"
          href={text}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600"
        >
          View Submission
        </Button>
      ) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: TaskProgress) => (
        <Space>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => handleApproveReject(record.taskId, record.projectId, record.userId, 'approve')}
            disabled={record.status === 'completed'}
            className="bg-green-500 hover:bg-green-600 border-none"
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleApproveReject(record.taskId, record.projectId, record.userId, 'reject')}
            disabled={record.status === 'completed'}
          >
            Reject
          </Button>
        </Space>
      ),
    }
  ];

  const items = [
    {
      key: '1',
      label: 'Tasks',
      children: (
        <Table
          dataSource={filteredTasks}
          columns={taskColumns}
          loading={loading}
          rowKey="id"
          className="bg-[#2a2a28] rounded-lg shadow-lg [&_th]:!bg-[#1a1a18] [&_th]:!text-[#f5efdb] [&_td]:!border-[#f5efdb1a] [&_tr:hover>td]:!bg-[#1a1a18]"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} tasks`,
            className: "text-[#f5efdb]"
          }}
        />
      ),
    },
    {
      key: '2',
      label: 'Task Progress',
      children: (
        <Table
          dataSource={filteredProgress}
          columns={progressColumns}
          loading={loading}
          rowKey="taskId"
          className="bg-[#2a2a28] rounded-lg shadow-lg [&_th]:!bg-[#1a1a18] [&_th]:!text-[#f5efdb] [&_td]:!border-[#f5efdb1a] [&_tr:hover>td]:!bg-[#1a1a18]"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} submissions`,
            className: "text-[#f5efdb]"
          }}
        />
      ),
    }
  ];

  return (
    <div className="min-h-screen bg-[#1a1a18] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="!text-[#f5efdb] !mb-1">
              Tasks Management
            </Title>
            <p className="text-[#f5efdb99]">
              Manage and monitor all tasks and submissions
            </p>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            onClick={() => router.push('/admin/dashboard/tasks/new')}
            className="bg-[#f5efdb] hover:bg-[#f5efdb]/90 text-[#1a1a18]"
          >
            Create New Task
          </Button>
        </div>

        <div className="bg-[#2a2a28] p-6 rounded-lg shadow-lg border border-[#f5efdb1a] space-y-6">
          <div className="flex gap-4">
            <Input
              placeholder="Search tasks..."
              prefix={<SearchOutlined className="text-[#f5efdb99]" />}
              onChange={e => handleSearch(e.target.value)}
              className="max-w-md bg-[#1a1a18] border-[#f5efdb1a] text-[#f5efdb]"
              size="large"
            />
            <Select
              defaultValue="all"
              style={{ width: 200 }}
              onChange={handleStatusFilter}
              size="large"
              className="border-[#f5efdb1a]"
              options={statusOptions}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-500/20 text-red-400 px-4 py-3 rounded">
              <p className="flex items-center">
                <CloseCircleOutlined className="mr-2" />
                {error}
              </p>
            </div>
          )}

          <Tabs
            defaultActiveKey="1"
            items={items}
            onChange={key => setActiveTab(key)}
            className="ant-tabs-custom [&_.ant-tabs-tab]:!text-[#f5efdb99] [&_.ant-tabs-tab-active]:!text-[#f5efdb]"
          />
        </div>
      </div>
    </div>
  );
};

export default TasksPage; 