import './icon.scss'

export default function Icon(props) {
  const {
    symbol,
    className,
    width,
    height,
    style = {},
    ...rest
  } = props

  return (
    <span style={{ ...style, width, height }} className='icon' {...rest}>
      <svg role="img" width={width} height={height}>
          <use xlinkHref={`#${symbol}`} />
        </svg>
    </span>
  )
}
