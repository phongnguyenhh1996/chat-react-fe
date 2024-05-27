import React, { useEffect, useState } from 'react'

const CountDown = ({time}) => {

  const [timer, setTimer] = useState(time)

  useEffect(() => {
    const interval = setInterval(() => setTimer(prev => prev - 1), 1000)
    return () => {
      clearInterval(interval)
    }
  })

  if (timer < 0) return

  return (
    <div>{timer}</div>
  )
}

export default CountDown