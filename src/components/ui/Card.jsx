import { forwardRef } from 'react';

const Card = forwardRef(function Card({ header, interactive = false, className = '', children, ...rest }, ref) {
  const classes = ['card', interactive ? 'card--interactive' : '', className].filter(Boolean).join(' ');
  return (
    <div ref={ref} className={classes} {...rest}>
      {header && <div className="card__header">{header}</div>}
      {children}
    </div>
  );
});

export default Card;
