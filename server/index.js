const express = require('express')
const cors = require('cors')
const app = express()
const PORT = 4000

//'qs 라이브러리'를 사용하여 복잡한 객체를 파싱함.
app.use(express.urlencoded({ extended: true }))
//json 형식의 요청 본문을 해석함. 주로 클라이언트가 json 데이터를 전송할 때 사용.
app.use(express.json())
//cors: cross-origin resource sharing 설정을 처리한다. 
//다른 모든 도메인에서의 요청을 허용함.
app.use(cors())

//app.get은 HTTP GET요청을 처리하기 위한 라우터를 설정하는 메서드이다. 
// '/api'는 라우터의 경로이다. 
//res.json은 응답할 데이터 이다. (요청에 대한 응답으로 보냄.)
app.get("/api", (req, res) => {
  res.json({
    message: "Hello world",
  })
})

//해당 PORT를 통해 포트를 통해 서버가 요청을 대기하도록 설정하는 함수
//뒤에 있는 콜백함수는 서버가 정상적으로 시작했을 때 호출됨. 
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});


//존재하는 유저를 담는 배열 -> 나중에 데이터베이스로 교체
const users = []
//8자리 문자열 ID 랜덤 반환 후, 36진수 문자열 변환 -> index 2~9 부분 문자열 반환
//즉, 사용자 고유한 ID를 생성할 수 있음.
const generateID = () => Math.random().toString(36).substring(2, 10)
//http post요청 처리
//api/register 경로로 post 요청이 들어오면 핸들러가 실행된다. 
//req -> 요청 객체 (클라이언트에서 전송된 데이터에 접근 가능)
//res -> 응답 객체 (클라이언트에게 응답을 보낼 수있음.)

app.post("/api/register", async (req, res) => {
  // 비동기 작업 예시: 데이터베이스 쿼리, 외부 API 호출 등
  //req.body에서 각 필드를 추출하여 변수에 할당. 
  const { email, password, username } = req.body
  //사용자에게 고유한 id생성
  const id = generateID()
  //출력
  console.log({ email, password, username, id })

  //전달 받은 데이터(email & password)가 배열 객체의 각각의 email & password와 동일한지 확인
  //filter는 users 배열에 담긴 각각의 객체. 
  const result = users.filter(
    (user) => user.email === email && user.password === password
  )

  //일치하는게 없다면 User객체를 만들어서 users 데이터에 push한다. 
  if (result.length === 0) {
    const newUser = { id, email, password, username }
    users.push(newUser)

    return res.json({
      message: "Account created successfully",
    })
  }

  res.json({
    error_message: "User already exists",
  });

})


app.post("/api/login", (req, res) => {
  const { email, password } = req.body
  let result = users.filter(
    (user) => user.email === email && user.password === password
  )

  //찾은 email과 password가 1개가 아니라면 에러메세지
  if (result.length !== 1) {
    return res.json({
      error_message: "Incorrect credentials",
    })
  }

  //Returns the id if successfully logged in
  res.json({
    message: "Login successfully",
    id: result[0].id,
  })

  console.log("(login) id: ", result)
})

//👇🏻 holds all the posts created
const threadList = [];

app.post("/api/create/thread", async (req, res) => {
  const { thread, userId } = req.body
  const threadId = generateID()

  console.log({ thread, userId, threadId })

  //👇🏻 add post details to the array
  threadList.unshift({
    id: threadId,
    title: thread,
    userId,
    replies: [],
    likes: [],
  });

  //👇🏻 Returns a response containing the posts
  res.json({
    message: "Thread created successfully!",
    threads: threadList,
  });
})

app.get("/api/all/threads", (req, res) => {
  res.json({
    threads: threadList,
  });
});

app.post("/api/thread/like", (req, res) => {
  //👇🏻 accepts the post id and the user id
  const { threadId, userId } = req.body;
  //👇🏻 gets the reacted post
  const result = threadList.filter((thread) => thread.id === threadId);
  //👇🏻 gets the likes property
  const threadLikes = result[0].likes;
  //👇🏻 authenticates the reaction
  const authenticateReaction = threadLikes.filter((user) => user === userId);
  //👇🏻 adds the users to the likes array
  if (authenticateReaction.length === 0) {
    threadLikes.push(userId);
    return res.json({
      message: "You've reacted to the post!",
    });
  }
  //👇🏻 Returns an error user has reacted to the post earlier
  res.json({
    error_message: "You can only react once!",
  });
});

app.post("/api/thread/replies", (req, res) => {
    //👇🏻 The post ID
    const { id } = req.body;
    //👇🏻 searches for the post
    const result = threadList.filter((thread) => thread.id === id);
    //👇🏻 return the title and replies
    res.json({
        replies: result[0].replies,
        title: result[0].title,
    });
});

app.post("/api/create/reply", async (req, res) => {
  //👇🏻 accepts the post id, user id, and reply
  const { id, userId, reply } = req.body;
  //👇🏻 search for the exact post that was replied to
  const result = threadList.filter((thread) => thread.id === id);
  //👇🏻 search for the user via its id
  const user = users.filter((user) => user.id === userId);
  //👇🏻 saves the user name and reply
  result[0].replies.unshift({
    userId: user[0].id,
    name: user[0].username,
    text: reply,
  });

  res.json({
    message: "Response added successfully!",
  });
});