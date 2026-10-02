// Development-only page (route PATHS.DEV_COMPONENTS, registered only when import.meta.env.DEV):
// every common component in each of its states, with sample data and no API calls.
import { useMemo, useState } from "react";
import { App, Button, Card, Col, Divider, Flex, Form, Input, Row, Segmented, Select, Space, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { Provider as JotaiProvider, createStore } from "jotai";
import AsyncContent from "../../components/common/AsyncContent";
import Can from "../../components/common/Can";
import ConfirmDelete from "../../components/common/ConfirmDelete";
import DataTable from "../../components/common/DataTable";
import EmptyState from "../../components/common/EmptyState";
import ErrorState from "../../components/common/ErrorState";
import FormModal from "../../components/common/FormModal";
import LoadingState from "../../components/common/LoadingState";
import PageHeader from "../../components/common/PageHeader";
import RoleTag from "../../components/common/RoleTag";
import UserAvatar from "../../components/common/UserAvatar";
import { ALL_ROLES, ROLES } from "../../constants/roles";
import type { Role } from "../../constants/roles";
import { emailRules, nameRules } from "../../constants/validation";
import { tokenAtom } from "../../store/authAtom";
import samplePhoto from "../../assets/hero.png";

const { Text, Title } = Typography;

const LONG_NAME = "Maximiliana Alexandra Konstantinopoulou-Vanderbilt Featherstonehaugh";

// --- Sample data -----------------------------------------------------------------------------

interface SampleRow {
  id: number;
  name: string;
  email: string;
  role: Role;
  department: string;
  graduation_year: number;
  current_company: string;
  job_title: string;
  photo_url?: string;
}

const DEPARTMENTS = ["Computer Science", "Electrical Engineering", "Business", "Mathematics"];
const FIRST = ["Ayesha", "Rahim", "Nadia", "Tanvir", "Sara", "Imran", "Lina", "Karim", "Mitu", "Fahim", "Zara", "Omar"];

const SAMPLE_ROWS: SampleRow[] = FIRST.map((first, i) => ({
  id: i + 1,
  name: i === 3 ? LONG_NAME : `${first} Rahman`,
  email: `${first.toLowerCase()}.rahman@example.edu`,
  role: ALL_ROLES[i % ALL_ROLES.length],
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  graduation_year: 2012 + i,
  current_company: i % 2 ? "Acme Software Ltd." : "Northwind Traders",
  job_title: i % 2 ? "Senior Software Engineer" : "Product Analyst",
  photo_url: i === 0 ? samplePhoto : undefined,
}));

interface ProfileValues {
  name: string;
  email: string;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Shaped like an axios error with a backend body, so the components show `error`.
const fakeApiError = (text: string) => ({ response: { status: 500, data: { error: text } } });

// --- Users for <Can> -------------------------------------------------------------------------

// Unsigned token with only the payload fields the frontend decodes (sub, role, exp).
function fakeToken(id: number, role: Role, expiresInSeconds: number): string {
  const encode = (value: object) => btoa(JSON.stringify(value));
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: "none" })}.${encode({ sub: id, role, exp })}.preview`;
}

interface PreviewUser {
  key: string;
  label: string;
  token: string | null;
}

const PREVIEW_USERS: PreviewUser[] = [
  { key: "none", label: "Logged out", token: null },
  { key: "student", label: "Student #1", token: fakeToken(1, ROLES.STUDENT, 3600) },
  { key: "alumni", label: "Alumni #2", token: fakeToken(2, ROLES.ALUMNI, 3600) },
  { key: "admin", label: "Admin #3", token: fakeToken(3, ROLES.ADMIN, 3600) },
  { key: "expired", label: "Alumni #2 (expired)", token: fakeToken(2, ROLES.ALUMNI, -60) },
];

interface CanRule {
  key: string;
  rule: string;
  example: string;
  props: { roles?: Role[]; ownerId?: number; allowAdmin?: boolean };
}

const CAN_RULES: CanRule[] = [
  { key: "any", rule: "<Can>", example: "Any logged-in user", props: {} },
  {
    key: "roles",
    rule: "roles={[alumni, admin]}",
    example: "New post",
    props: { roles: [ROLES.ALUMNI, ROLES.ADMIN] },
  },
  { key: "admin", rule: "roles={[admin]}", example: "User Management", props: { roles: [ROLES.ADMIN] } },
  { key: "owner", rule: "ownerId={2}", example: "Edit post of user #2", props: { ownerId: 2 } },
  {
    key: "ownerOrAdmin",
    rule: "ownerId={2} allowAdmin",
    example: "Delete post of user #2",
    props: { ownerId: 2, allowAdmin: true },
  },
];

// --- Page ------------------------------------------------------------------------------------

export default function ComponentPreviewPage() {
  const { message } = App.useApp();

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>();
  const [asyncView, setAsyncView] = useState<"Loading" | "Error" | "Empty" | "Content">("Loading");
  const [modal, setModal] = useState<"create" | "edit" | "fail" | null>(null);

  // One Jotai store per sample user, so each <Can> cell sees a different logged-in user.
  const userStores = useMemo(
    () =>
      PREVIEW_USERS.map((user) => {
        const store = createStore();
        store.set(tokenAtom, user.token);
        return store;
      }),
    []
  );

  const filteredRows = SAMPLE_ROWS.filter(
    (row) =>
      (!search || `${row.name} ${row.email}`.toLowerCase().includes(search.toLowerCase())) &&
      (!department || row.department === department)
  );

  const tableColumns: ColumnsType<SampleRow> = [
    {
      title: "Name",
      key: "name",
      width: 220,
      render: (_, row) => <UserAvatar name={row.name} photoUrl={row.photo_url} showName />,
    },
    { title: "Email", dataIndex: "email" },
    { title: "Role", dataIndex: "role", render: (role: Role) => <RoleTag role={role} /> },
    { title: "Department", dataIndex: "department" },
    { title: "Graduated", dataIndex: "graduation_year" },
    { title: "Company", dataIndex: "current_company" },
    { title: "Job title", dataIndex: "job_title" },
    {
      title: "Actions",
      key: "actions",
      render: (_, row) => (
        <ConfirmDelete
          title={`Delete ${row.name}?`}
          description="Sample row; nothing is really deleted."
          onConfirm={() => wait(800)}
        >
          <Button danger size="small" icon={<DeleteOutlined />} aria-label="Delete" />
        </ConfirmDelete>
      ),
    },
  ];

  const canColumns: ColumnsType<CanRule> = [
    {
      title: "Rule",
      key: "rule",
      render: (_, rule) => (
        <Space orientation="vertical" size={0}>
          <Text code>{rule.rule}</Text>
          <Text type="secondary">{rule.example}</Text>
        </Space>
      ),
    },
    ...PREVIEW_USERS.map((user, i) => ({
      title: user.label,
      key: user.key,
      render: (_: unknown, rule: CanRule) => (
        <JotaiProvider store={userStores[i]}>
          <Can {...rule.props} fallback={<Tag>Hidden</Tag>}>
            <Tag color="success">Shown</Tag>
          </Can>
        </JotaiProvider>
      ),
    })),
  ];

  const submitProfile = async (values: ProfileValues) => {
    await wait(1000);
    if (modal === "fail") throw fakeApiError("Email is already registered (sample backend error)");
    message.success(`Saved ${values.name}`);
    setModal(null);
  };

  return (
    <Card variant="borderless">
      <PageHeader
        title="Component preview"
        subtitle="Development only. Every common component in each state, with sample data."
      />

      {/* PageHeader */}
      <Divider />
      <Title level={4}>PageHeader</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card size="small" title="Title only">
            <PageHeader title="Alumni Directory" />
          </Card>
        </Col>
        <Col xs={24}>
          <Card size="small" title="Title + subtitle">
            <PageHeader title="My Profile" subtitle="Your account details" />
          </Card>
        </Col>
        <Col xs={24}>
          <Card size="small" title="Breadcrumb + extra">
            <PageHeader
              title="Ayesha Rahman"
              subtitle="Class of 2012"
              breadcrumb={[{ title: "Alumni" }, { title: "Ayesha Rahman" }]}
              extra={
                <Button type="primary" icon={<EditOutlined />}>
                  Edit
                </Button>
              }
            />
          </Card>
        </Col>
        <Col xs={24}>
          <Card size="small" title="Long title + several actions (must wrap, no page scroll)">
            <PageHeader
              title={`Posts by ${LONG_NAME} and other alumni from the class of 2012`}
              subtitle="A long subtitle that also needs to wrap nicely on a narrow phone screen"
              breadcrumb={[{ title: "Dashboard" }, { title: "Posts" }, { title: "Archive" }]}
              extra={
                <>
                  <Button>Export</Button>
                  <Button>Filter</Button>
                  <Button type="primary" icon={<PlusOutlined />}>
                    New post
                  </Button>
                </>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* AsyncContent */}
      <Divider />
      <Title level={4}>AsyncContent</Title>
      <Card size="small" title="Switch state">
        <Flex vertical gap="middle">
          <Segmented
            block
            options={["Loading", "Error", "Empty", "Content"]}
            value={asyncView}
            onChange={(value) => setAsyncView(value as typeof asyncView)}
          />
          <AsyncContent
            loading={asyncView === "Loading"}
            error={asyncView === "Error" ? fakeApiError("Could not load alumni (sample)") : undefined}
            empty={asyncView === "Empty"}
            emptyText="No alumni yet"
            onRetry={() => message.info("Retry clicked")}
          >
            <Text>The loaded content appears here.</Text>
          </AsyncContent>
        </Flex>
      </Card>

      {/* LoadingState / EmptyState / ErrorState */}
      <Divider />
      <Title level={4}>LoadingState, EmptyState, ErrorState</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="LoadingState">
            <LoadingState />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="LoadingState with tip">
            <LoadingState tip="Loading alumni…" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="EmptyState">
            <EmptyState description="No posts yet" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="EmptyState with action">
            <EmptyState
              description="You have no alumni profile"
              action={
                <Button type="primary" icon={<PlusOutlined />}>
                  Add my alumni profile
                </Button>
              }
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="ErrorState: backend error + retry">
            <ErrorState
              error={fakeApiError("Database connection failed (sample)")}
              onRetry={() => message.info("Retry clicked")}
            />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="ErrorState: Error object, no retry">
            <ErrorState error={new Error("Network Error")} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="ErrorState: unknown value (fallback text)">
            <ErrorState error={42} />
          </Card>
        </Col>
      </Row>

      {/* DataTable */}
      <Divider />
      <Title level={4}>DataTable</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card size="small" title="Data + search + toolbar + pagination (12 rows)">
            <DataTable<SampleRow>
              columns={tableColumns}
              data={filteredRows}
              rowKey="id"
              onSearch={setSearch}
              searchPlaceholder="Search name or email"
              toolbar={
                <>
                  <Select
                    allowClear
                    placeholder="Department"
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    value={department}
                    onChange={setDepartment}
                    popupMatchSelectWidth={false}
                  />
                  <Button type="primary" icon={<PlusOutlined />}>
                    Add
                  </Button>
                </>
              }
            />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card size="small" title="Loading">
            <DataTable<SampleRow> columns={tableColumns} data={[]} rowKey="id" loading />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card size="small" title="Empty">
            <DataTable<SampleRow> columns={tableColumns} data={[]} rowKey="id" />
          </Card>
        </Col>
      </Row>

      {/* FormModal */}
      <Divider />
      <Title level={4}>FormModal</Title>
      <Card size="small" title="Open a modal (every submit takes 1 s)">
        <Space wrap>
          <Button onClick={() => setModal("create")}>Create (empty)</Button>
          <Button onClick={() => setModal("edit")}>Edit (prefilled)</Button>
          <Button danger onClick={() => setModal("fail")}>
            Edit, submit fails
          </Button>
        </Space>
      </Card>
      <FormModal<ProfileValues>
        open={modal !== null}
        title={modal === "create" ? "Create profile" : "Edit profile"}
        submitText={modal === "create" ? "Create" : "Save"}
        initialValues={
          modal === "create" ? undefined : { name: "Ayesha Rahman", email: "ayesha.rahman@example.edu" }
        }
        onSubmit={submitProfile}
        onCancel={() => setModal(null)}
      >
        <Form.Item name="name" label="Name" rules={nameRules}>
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email" rules={emailRules}>
          <Input />
        </Form.Item>
      </FormModal>

      {/* ConfirmDelete */}
      <Divider />
      <Title level={4}>ConfirmDelete</Title>
      <Card size="small" title="Click a trigger, then Delete">
        <Space wrap>
          <ConfirmDelete
            title="Delete this post?"
            description="This cannot be undone."
            onConfirm={() => wait(1000)}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete (succeeds)
            </Button>
          </ConfirmDelete>
          <ConfirmDelete
            title="Delete this user?"
            onConfirm={async () => {
              await wait(1000);
              throw fakeApiError("User still has posts (sample foreign-key error)");
            }}
          >
            <Button danger icon={<DeleteOutlined />}>
              Delete (fails)
            </Button>
          </ConfirmDelete>
        </Space>
      </Card>

      {/* RoleTag */}
      <Divider />
      <Title level={4}>RoleTag</Title>
      <Card size="small" title="Every role">
        <Space wrap>
          {ALL_ROLES.map((role) => (
            <RoleTag key={role} role={role} />
          ))}
        </Space>
      </Card>

      {/* UserAvatar */}
      <Divider />
      <Title level={4}>UserAvatar</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="Photo / broken photo URL / no photo">
            <Space wrap>
              <UserAvatar name="Ayesha Rahman" photoUrl={samplePhoto} size="large" />
              <UserAvatar name="Rahim Uddin" photoUrl="/missing-photo.png" size="large" />
              <UserAvatar name="Nadia Islam" size="large" />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="One-word name / empty name">
            <Space wrap>
              <UserAvatar name="Tanvir" size="large" />
              <UserAvatar name="" size="large" />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="Sizes: small, default, large, 64">
            <Space wrap align="center">
              <UserAvatar name="Sara Khan" size="small" />
              <UserAvatar name="Sara Khan" />
              <UserAvatar name="Sara Khan" size="large" />
              <UserAvatar name="Sara Khan" size={64} />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="showName">
            <Space orientation="vertical">
              <UserAvatar name="Ayesha Rahman" photoUrl={samplePhoto} showName />
              <UserAvatar name="Imran Hossain" showName />
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12} xl={8}>
          <Card size="small" title="showName, very long name (ellipsis + tooltip)">
            <UserAvatar name={LONG_NAME} showName />
          </Card>
        </Col>
      </Row>

      {/* Can */}
      <Divider />
      <Title level={4}>Can</Title>
      <Card size="small" title="Shown / hidden for each sample user (fallback = grey Hidden tag)">
        <DataTable<CanRule> columns={canColumns} data={CAN_RULES} rowKey="key" />
      </Card>
    </Card>
  );
}
